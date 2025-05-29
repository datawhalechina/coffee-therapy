# ChatGPT 云函数

这个云函数用于调用 ARK API 的大模型能力，支持聊天对话、保存对话历史等功能。

## 功能特点

- 支持调用 ARK API 的 deepseek-v3-250324 等模型
- 自动保存对话历史到数据库
- 支持多会话管理
- 灵活的参数配置

## 使用前准备

1. 在 `.env` 文件中设置您的 ARK API 密钥
2. 确保云开发环境已初始化
3. 创建 `chatSessions` 数据库集合用于存储对话历史

## 调用示例

### 1. 发送单条消息 (sendMessage)

```javascript
wx.cloud.callFunction({
  name: 'chatgpt',
  data: {
    name: 'sendMessage',
    message: '你好，请介绍一下自己',
    sessionId: 'user_session_123', // 可选，默认为 'default_session'
    model: 'deepseek-v3-250324', // 可选
    temperature: 0.7, // 可选
    max_tokens: 1000 // 可选
  }
}).then(res => {
  console.log('AI回复:', res.result);
})
```

### 2. 直接发送完整消息数组 (chat)

```javascript
wx.cloud.callFunction({
  name: 'chatgpt',
  data: {
    name: 'chat',
    messages: [
      { role: 'system', content: '你是一个专业的咖啡师.' },
      { role: 'user', content: '请推荐一款适合早晨喝的咖啡' }
    ],
    sessionId: 'coffee_session', // 可选
    model: 'deepseek-v3-250324', // 可选
    temperature: 0.7 // 可选
  }
}).then(res => {
  console.log('AI回复:', res.result);
})
```

### 3. 获取对话历史 (getHistory)

```javascript
wx.cloud.callFunction({
  name: 'chatgpt',
  data: {
    name: 'getHistory',
    sessionId: 'user_session_123' // 可选，默认为 'default_session'
  }
}).then(res => {
  console.log('对话历史:', res.result.history);
})
```

### 4. 清空对话历史 (clearHistory)

```javascript
wx.cloud.callFunction({
  name: 'chatgpt',
  data: {
    name: 'clearHistory',
    sessionId: 'user_session_123' // 可选，默认为 'default_session'
  }
}).then(res => {
  console.log('清空结果:', res.result);
})
```

## 部署说明

1. 安装依赖：
   ```
   npm install
   ```

2. 部署云函数：
   - 在微信开发者工具中右键点击 chatgpt 文件夹
   - 选择"上传并部署：云端安装依赖"

## 数据库结构

云函数使用 `chatSessions` 集合存储对话历史，结构如下：

```
{
  userId: String,     // 用户openid
  sessionId: String,  // 会话ID
  messages: Array,    // 消息数组，包含role和content
  createTime: Date,   // 创建时间
  updateTime: Date    // 更新时间
}
```

## 注意事项

- 请确保 ARK API 密钥的安全，不要将其硬编码在代码中
- 对话历史会占用数据库存储空间，建议定期清理过期会话
- API 调用可能会产生费用，请关注 ARK API 的计费规则
