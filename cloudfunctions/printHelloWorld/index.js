// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境
cloud.init({
  env: 'cloud1-4gythsnw8615145d'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 定义要写入的数据，仅包含时间
    const data = {
      date: new Date(),
      timestamp: db.serverDate()
    }
    
    // 写入数据库
    const result = await db.collection('timerLogs').add({
      data: data
    })
    
    console.log('数据已写入数据库', result)
    
    return {
      success: true,
      result: result
    }
  } catch (error) {
    console.error('写入数据库失败:', error)
    return {
      success: false,
      error: error
    }
  }
}
