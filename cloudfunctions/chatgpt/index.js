// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV,
    traceUser: true
})

// 获取API密钥
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

// 调用阿里云DashScope API进行聊天补全
async function chatCompletion(messages, model = 'deepseek-v3', temperature = 0.7, max_tokens = 1000) {
  try {
    console.log('调用DashScope API开始，模型:', model);
    console.log('请求参数:', JSON.stringify({
      model, 
      messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 20) + '...' }))
    }));
    
    // 设置更长的超时时间
    const response = await axios({
      method: 'post',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens
      },
      timeout: 50000 // 50秒超时，比云函数的60秒小，确保有时间处理响应
    });
    
    console.log('DashScope API 响应成功，请求ID:', response.headers['x-request-id'] || '未知');
    return response.data;
  } catch (error) {
    // 详细记录错误信息
    console.error('DashScope API调用失败:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
    });
    
    // 构建更详细的错误信息
    let errorMessage = 'DashScope API调用失败: ';
    if (error.code === 'ECONNABORTED') {
      errorMessage += '请求超时，请稍后重试';
    } else if (error.response) {
      errorMessage += `服务器返回错误 [${error.response.status}]: ${JSON.stringify(error.response.data)}`;
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
        
        // 获取历史消息
        let historyMessages = await getConversationHistory(wxContext.OPENID, currentSessionId);
        
        // 如果没有系统消息，添加默认系统消息
        if (historyMessages.length === 0 || historyMessages[0].role !== 'system') {
          historyMessages = [
            { role: 'system', content: '你是人工智能助手.' },
            ...historyMessages
          ];
        }
        
        // 添加用户新消息
        historyMessages.push({ role: 'user', content: message });
        
        // 记录开始请求时间
        const startTime = Date.now();
        console.log(`开始请求，会话 ID: ${currentSessionId}`);
        
        let response;
        let modelUsed = model || 'deepseek-v3';
        let retryCount = 0;
        const maxRetries = 2;
        
        // 带重试的API调用
        while (retryCount <= maxRetries) {
          try {
            // 调用API获取回复
            response = await chatCompletion(
              historyMessages, 
              modelUsed,
              temperature || 0.7,
              max_tokens || 1000
            );
            break; // 请求成功，跳出循环
          } catch (apiError) {
            retryCount++;
            console.log(`尝试 ${retryCount}/${maxRetries} 失败: ${apiError.message}`);
            
            if (retryCount <= maxRetries) {
              // 如果不是最后一次重试，尝试切换模型
              if (modelUsed === 'deepseek-v3') {
                modelUsed = 'mixtral-8x7b';
                console.log(`切换到备用模型: ${modelUsed}`);
              } else {
                modelUsed = 'deepseek-v3-250324';
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
              
              // 保存用户消息但不保存模拟响应
              // 这样用户可以稍后再试而不会丢失上下文
              await saveConversation(wxContext.OPENID, currentSessionId, historyMessages);
              
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
        
        // 添加AI回复到历史
        const assistantMessage = response.choices[0].message;
        historyMessages.push(assistantMessage);
        
        // 保存对话历史
        await saveConversation(wxContext.OPENID, currentSessionId, historyMessages);
        
        return {
          success: true,
          reply: assistantMessage.content,
          usage: response.usage,
          model: modelUsed,
          responseTime: (endTime - startTime) / 1000,
          history: historyMessages
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
        
        // 记录开始请求时间
        const startTime = Date.now();
        console.log(`开始 chat 请求，会话 ID: ${currentSessionId || '无'}`);
        
        let response;
        let modelUsed = model || 'deepseek-v3';
        let retryCount = 0;
        const maxRetries = 2;
        
        // 带重试的API调用
        while (retryCount <= maxRetries) {
          try {
            // 调用API获取回复
            response = await chatCompletion(
              messages, 
              modelUsed,
              temperature || 0.7,
              max_tokens || 1000
            );
            break; // 请求成功，跳出循环
          } catch (apiError) {
            retryCount++;
            console.log(`尝试 ${retryCount}/${maxRetries} 失败: ${apiError.message}`);
            
            if (retryCount <= maxRetries) {
              // 如果不是最后一次重试，尝试切换模型
              if (modelUsed === 'deepseek-v3') {
                modelUsed = 'qwen-plus';
                console.log(`切换到备用模型: ${modelUsed}`);
              } else {
                modelUsed = 'deepseek-v3';
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
        
        // 如果有会话 ID，保存对话
        if (currentSessionId) {
          const updatedMessages = [...messages, assistantMessage];
          await saveConversation(wxContext.OPENID, currentSessionId, updatedMessages);
        }
        
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
