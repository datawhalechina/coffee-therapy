// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

cloud.init({
  env: 'cloud1-4gythsnw8615145d'
})

// 获取API密钥
const ARK_API_KEY = process.env.ARK_API_KEY

// 调用ARK API进行聊天补全
async function chatCompletion(messages, model = 'deepseek-v3-250324', temperature = 0.7, max_tokens = 1000) {
  try {
    console.log('调用ARK API，模型:', model);
    
    const response = await axios({
      method: 'post',
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      headers: {
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens
      }
    });
    
    console.log('ARK API 响应成功');
    return response.data;
  } catch (error) {
    console.error('ARK API调用失败:', error.response ? error.response.data : error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
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
        
        // 调用API获取回复
        const response = await chatCompletion(
          historyMessages, 
          model || 'deepseek-v3-250324',
          temperature || 0.7,
          max_tokens || 1000
        );
        
        // 添加AI回复到历史
        const assistantMessage = response.choices[0].message;
        historyMessages.push(assistantMessage);
        
        // 保存对话历史
        await saveConversation(wxContext.OPENID, currentSessionId, historyMessages);
        
        return {
          success: true,
          reply: assistantMessage.content,
          usage: response.usage,
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
        
        // 调用API获取回复
        const response = await chatCompletion(
          messages, 
          model || 'deepseek-v3-250324',
          temperature || 0.7,
          max_tokens || 1000
        );
        
        // 获取AI回复
        const assistantMessage = response.choices[0].message;
        
        // 如果有会话ID，保存对话
        if (currentSessionId) {
          const updatedMessages = [...messages, assistantMessage];
          await saveConversation(wxContext.OPENID, currentSessionId, updatedMessages);
        }
        
        return {
          success: true,
          reply: assistantMessage.content,
          message: assistantMessage,
          usage: response.usage
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
