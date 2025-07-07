// 云函数入口文件
const cloud = require('wx-server-sdk')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV,
    traceUser: true
})

// 获取API密钥
const ARK_API_KEY = process.env.ARK_API_KEY

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: ARK_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
})

/**
 * 调用字节跳动豆包API进行聊天补全
 * @param {Array} messages - 对话消息数组
 * @param {string} model - 模型名称，默认为 'ep-20250222115626-vcvd4'
 * @param {number} temperature - 温度参数，默认为 1.0
 * @param {number} max_tokens - 最大token数，默认为 1000
 * @returns {Object} API响应数据
 */
async function chatCompletion(messages, model = 'ep-20250222115626-vcvd4', temperature = 1.0, max_tokens = 1000) {
  try {
    console.log('调用豆包API开始，模型:', model);
    console.log('请求参数:', JSON.stringify({
      model, 
      messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 20) + '...' }))
    }));
    
    // 使用OpenAI客户端调用API
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      timeout: 50000, // 50秒超时
      // extra_body: {
      //   thinking: {
      //     type: "disabled" // 不使用深度思考能力
      //     // type: "enabled" // 使用深度思考能力
      //   }
      // }
    });
    
    console.log('豆包API 响应成功');
    return response;
  } catch (error) {
    // 详细记录错误信息
    console.error('豆包API调用失败:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
    // 构建更详细的错误信息
    let errorMessage = '豆包API调用失败: ';
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage += '请求超时，请稍后重试';
    } else if (error.status) {
      errorMessage += `服务器返回错误 [${error.status}]: ${error.message}`;
    } else {
      errorMessage += error.message;
    }
    
    throw new Error(errorMessage);
  }
}

// 保存对话历史到数据库
async function saveConversation(userId, sessionId, messages) {
  try {
    const db = cloud.database();
    
    // 查询是否存在会话记录
    const existingSession = await db.collection('chatSessions')
      .where({
        userId: userId,
        sessionId: sessionId
      })
      .get();
    
    if (existingSession.data && existingSession.data.length > 0) {
      // 更新现有会话
      await db.collection('chatSessions').doc(existingSession.data[0]._id).update({
        data: {
          messages: messages,
          updateTime: db.serverDate()
        }
      });
    } else {
      // 创建新会话
      await db.collection('chatSessions').add({
        data: {
          userId: userId,
          sessionId: sessionId,
          messages: messages,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('保存对话历史失败:', error);
    return false;
  }
}

// 获取对话历史
async function getConversationHistory(userId, sessionId) {
  try {
    const db = cloud.database();
    
    const session = await db.collection('chatSessions')
      .where({
        userId: userId,
        sessionId: sessionId
      })
      .get();
    
    if (session.data && session.data.length > 0) {
      return session.data[0].messages || [];
    }
    
    return [];
  } catch (error) {
    console.error('获取对话历史失败:', error);
    return [];
  }
}

/**
 * 从rainbowcard数据库随机获取3条疗愈卡片数据
 * @returns {Array} 随机的3条卡片数据
 */
async function getRandomRainbowCards() {
  try {
    const db = cloud.database();
    
    // 获取所有卡片的总数
    const countResult = await db.collection('rainbowcard').count();
    const totalCount = countResult.total;
    
    if (totalCount < 3) {
      console.log('数据库中卡片数量不足3条');
      return [];
    }
    
    // 生成3个随机数
    const randomIndices = [];
    while (randomIndices.length < 3) {
      const randomIndex = Math.floor(Math.random() * totalCount);
      if (!randomIndices.includes(randomIndex)) {
        randomIndices.push(randomIndex);
      }
    }
    
    // 获取随机卡片数据
    const randomCards = [];
    for (const index of randomIndices) {
      const result = await db.collection('rainbowcard')
        .skip(index)
        .limit(1)
        .get();
      
      if (result.data && result.data.length > 0) {
        randomCards.push(result.data[0]);
      }
    }
    
    console.log(`成功获取${randomCards.length}条随机卡片数据`);
    return randomCards;
  } catch (error) {
    console.error('获取随机卡片数据失败:', error);
    return [];
  }
}

/**
 * 构建包含随机卡片参考的prompt
 * @param {string} originalMessage - 原始用户消息
 * @returns {string} 包含参考数据的完整prompt
 */
async function buildPromptWithReference(originalMessage) {
  try {
    // 获取随机卡片数据
    const randomCards = await getRandomRainbowCards();
    
    if (randomCards.length === 0) {
      console.log('无法获取参考卡片数据，使用原始消息');
      return originalMessage;
    }
    
    // 构建参考内容
    let referenceText = '\n\n参考如下：\n';
    randomCards.forEach((card, index) => {
      referenceText += `${index + 1}. ${card.content}\n   ${card.translation}\n`;
    });
    
    // 拼接原始消息和参考内容
    return originalMessage + referenceText;
  } catch (error) {
    console.error('构建带参考的prompt失败:', error);
    return originalMessage;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { name, messages, message, sessionId, model, temperature, max_tokens } = event;
  
  // 默认会话ID
  const currentSessionId = sessionId || 'default_session';
  
  // 根据不同的name参数执行不同的操作
  switch (name) {
    // 发送单条消息并获取回复
    case 'sendMessage':
      try {
        if (!message) {
          return {
            success: false,
            error: '缺少消息内容'
          };
        }
        
        // 构建包含随机卡片参考的prompt
        const messageWithReference = await buildPromptWithReference(message);
        
        // 不携带历史消息，每次都是独立对话
        const messages = [
          { role: 'system', content: '你是人工智能助手.' },
          { role: 'user', content: messageWithReference }
        ];
        
        // 记录开始请求时间
        const startTime = Date.now();
        console.log(`开始请求，会话 ID: ${currentSessionId}`);
        
        let response;
        let modelUsed = model || 'ep-20250222115626-vcvd4';
        let retryCount = 0;
        const maxRetries = 2;
        
        // 带重试的API调用
        while (retryCount <= maxRetries) {
          try {
            // 调用API获取回复
            response = await chatCompletion(
              messages, 
              modelUsed,
              temperature || 1.0,
              max_tokens || 1000
            );
            break; // 请求成功，跳出循环
          } catch (apiError) {
            retryCount++;
            console.log(`尝试 ${retryCount}/${maxRetries} 失败: ${apiError.message}`);
            
            if (retryCount <= maxRetries) {
              // 如果不是最后一次重试，尝试切换模型
              if (modelUsed === 'ep-20250222115626-vcvd4') {
                modelUsed = 'ep-20250222115626-vcvd4';
                console.log(`切换到备用模型: ${modelUsed}`);
              } else {
                modelUsed = 'ep-20250222115626-vcvd4';
                console.log(`切换回默认模型: ${modelUsed}`);
              }
              
              // 等待一小段时间再重试
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              // 所有重试失败后，生成一个模拟响应
              console.log('所有重试失败，返回模拟响应');
              
              // 创建一个简单的模拟响应
              response = {
                choices: [{
                  message: {
                    role: 'assistant',
                    content: '非常抱歉，服务器正忙，无法处理您的请求。请稍后再试。'
                  }
                }],
                usage: {
                  prompt_tokens: 0,
                  completion_tokens: 0,
                  total_tokens: 0
                },
                isFallbackResponse: true
              };
              
              // 不保存对话历史，每次都是独立对话
              
              return {
                success: true,
                reply: response.choices[0].message.content,
                isFallbackResponse: true,
                error: apiError.message
              };
            }
          }
        }
        
        // 记录完成时间和响应信息
        const endTime = Date.now();
        console.log(`请求完成，用时: ${(endTime - startTime) / 1000} 秒`);
        console.log(`使用模型: ${modelUsed}, 重试次数: ${retryCount}`);
        
        // 获取AI回复
        const assistantMessage = response.choices[0].message;
        
        // 不保存对话历史，每次都是独立对话
        
        return {
          success: true,
          reply: assistantMessage.content,
          usage: response.usage,
          model: modelUsed,
          responseTime: (endTime - startTime) / 1000
        };
      } catch (error) {
        console.error('处理消息失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
    
    // 直接发送完整的消息数组
    case 'chat':
      try {
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return {
            success: false,
            error: '缺少有效的消息数组'
          };
        }
        
        // 修改最后一条用户消息，添加随机卡片参考
        const modifiedMessages = [...messages];
        const lastMessage = modifiedMessages[modifiedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          const messageWithReference = await buildPromptWithReference(lastMessage.content);
          lastMessage.content = messageWithReference;
        }
        
        // 记录开始请求时间
        const startTime = Date.now();
        console.log(`开始 chat 请求，会话 ID: ${currentSessionId || '无'}`);
        
        let response;
        let modelUsed = model || 'ep-20250222115626-vcvd4';
        let retryCount = 0;
        const maxRetries = 2;
        
        // 带重试的API调用
        while (retryCount <= maxRetries) {
          try {
            // 调用API获取回复
            response = await chatCompletion(
              modifiedMessages, 
              modelUsed,
              temperature || 1.0,
              max_tokens || 1000
            );
            break; // 请求成功，跳出循环
          } catch (apiError) {
            retryCount++;
            console.log(`尝试 ${retryCount}/${maxRetries} 失败: ${apiError.message}`);
            
            if (retryCount <= maxRetries) {
              // 如果不是最后一次重试，尝试切换模型
              if (modelUsed === 'ep-20250222115626-vcvd4') {
                modelUsed = 'ep-20250222115626-vcvd4';
                console.log(`切换到备用模型: ${modelUsed}`);
              } else {
                modelUsed = 'ep-20250222115626-vcvd4';
                console.log(`切换回默认模型: ${modelUsed}`);
              }
              
              // 等待一小段时间再重试
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              // 所有重试失败后，生成一个模拟响应
              console.log('所有重试失败，返回模拟响应');
              
              return {
                success: false,
                isFallbackResponse: true,
                error: apiError.message,
                reply: '非常抱歉，服务器正忙，无法处理您的请求。请稍后再试。'
              };
            }
          }
        }
        
        // 记录完成时间和响应信息
        const endTime = Date.now();
        console.log(`请求完成，用时: ${(endTime - startTime) / 1000} 秒`);
        console.log(`使用模型: ${modelUsed}, 重试次数: ${retryCount}`);
        
        // 获取AI回复
        const assistantMessage = response.choices[0].message;
        
        // 不保存对话历史，每次都是独立对话
        
        return {
          success: true,
          reply: assistantMessage.content,
          message: assistantMessage,
          usage: response.usage,
          model: modelUsed,
          responseTime: (endTime - startTime) / 1000
        };
      } catch (error) {
        console.error('聊天请求失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
    
    // 获取对话历史
    case 'getHistory':
      try {
        // 获取历史消息
        const historyMessages = await getConversationHistory(wxContext.OPENID, currentSessionId);
        
        return {
          success: true,
          history: historyMessages,
          sessionId: currentSessionId
        };
      } catch (error) {
        console.error('获取对话历史失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
    
    // 清空对话历史
    case 'clearHistory':
      try {
        const db = cloud.database();
        
        // 查找并删除会话
        const session = await db.collection('chatSessions')
          .where({
            userId: wxContext.OPENID,
            sessionId: currentSessionId
          })
          .remove();
        
        return {
          success: true,
          message: '对话历史已清空',
          sessionId: currentSessionId
        };
      } catch (error) {
        console.error('清空对话历史失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    default:
      return {
        success: false,
        error: '不支持的操作类型'
      };
  }
}
