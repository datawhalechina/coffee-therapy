// 上传彩虹卡片数据到云数据库
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
  traceUser: true
})

const db = cloud.database()

/**
 * 完整的疗愈卡片数据（从原始CSV修复后的完整数据）
 * 总计160条记录，包含6种颜色：红色(15)、橙色(22)、黄色(31)、绿色(31)、蓝色(46)、靛色(15)
 */
// 从外部文件导入完整数据
const fs = require('fs')
const path = require('path')

// 读取完整的数据文件
const HEALING_CARDS_DATA = require('./healing_cards_data.json')

/**
 * 批量上传数据到数据库
 * @param {Array} data - 要上传的数据数组
 * @param {number} batchSize - 每批上传的数量
 * @returns {Object} 上传结果
 */
async function batchUpload(data, batchSize = 20) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }
  
  console.log(`开始批量上传 ${data.length} 条记录，每批 ${batchSize} 条`)
  
  // 分批处理
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    console.log(`上传第 ${Math.floor(i / batchSize) + 1} 批，记录 ${i + 1}-${Math.min(i + batchSize, data.length)}`)
    
    try {
      // 准备批量数据
      const batchData = batch.map(card => ({
        ...card,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        status: 'active'
      }))
      
      // 批量插入
      const res = await db.collection('rainbowcard').add({
        data: batchData
      })
      
      results.success += batch.length
      console.log(`第 ${Math.floor(i / batchSize) + 1} 批上传成功，插入了 ${batch.length} 条记录`)
      
    } catch (error) {
      console.error(`第 ${Math.floor(i / batchSize) + 1} 批上传失败:`, error)
      results.failed += batch.length
      results.errors.push({
        batch: Math.floor(i / batchSize) + 1,
        range: `${i + 1}-${Math.min(i + batchSize, data.length)}`,
        error: error.message
      })
    }
    
    // 稍微延迟一下，避免并发过高
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * 清空数据库中的所有记录
 * @returns {Object} 清空结果
 */
async function clearDatabase() {
  try {
    console.log('开始清空数据库...')
    
    // 先查询所有记录
    const { data } = await db.collection('rainbowcard').get()
    
    if (data.length === 0) {
      console.log('数据库已经是空的')
      return { success: true, deleted: 0 }
    }
    
    console.log(`找到 ${data.length} 条现有记录，准备删除...`)
    
    // 批量删除
    let deleted = 0
    for (const record of data) {
      try {
        await db.collection('rainbowcard').doc(record._id).remove()
        deleted++
      } catch (error) {
        console.error(`删除记录 ${record._id} 失败:`, error)
      }
    }
    
    console.log(`成功删除 ${deleted} 条记录`)
    return { success: true, deleted }
    
  } catch (error) {
    console.error('清空数据库失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 验证数据库中的数据
 * @returns {Object} 验证结果
 */
async function validateDatabase() {
  try {
    console.log('开始验证数据库数据...')
    
    // 查询所有记录
    const { data } = await db.collection('rainbowcard').get()
    console.log(`数据库中共有 ${data.length} 条记录`)
    
    // 按颜色统计
    const colorStats = {}
    const issues = []
    
    data.forEach((card, index) => {
      // 统计颜色
      const color = card.color
      if (!colorStats[color]) {
        colorStats[color] = 0
      }
      colorStats[color]++
      
      // 检查数据完整性
      if (!card.content || !card.translation || !card.color) {
        issues.push({
          id: card.id || index,
          issue: '缺少必要字段',
          record: card
        })
      }
      
      // 检查翻译是否完整
      if (card.translation && card.translation.length < 10) {
        issues.push({
          id: card.id || index,
          issue: '翻译可能不完整',
          translation: card.translation
        })
      }
    })
    
    return {
      success: true,
      total: data.length,
      colorStats,
      issues,
      sampleData: data.slice(0, 3)
    }
    
  } catch (error) {
    console.error('验证数据库失败:', error)
    return { success: false, error: error.message }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, clearFirst = false, batchSize = 20 } = event
  
  console.log('上传彩虹卡片云函数开始执行, action:', action)
  
  try {
    switch (action) {
      case 'upload':
        let uploadResult = { success: true }
        
        // 如果需要，先清空数据库
        if (clearFirst) {
          const clearResult = await clearDatabase()
          uploadResult.clearResult = clearResult
          
          if (!clearResult.success) {
            return {
              success: false,
              error: '清空数据库失败',
              details: clearResult
            }
          }
        }
        
        // 上传数据
        const batchResult = await batchUpload(HEALING_CARDS_DATA, batchSize)
        uploadResult.uploadResult = batchResult
        
        console.log('上传完成，结果:', batchResult)
        
        return {
          success: batchResult.failed === 0,
          message: `上传完成。成功: ${batchResult.success}, 失败: ${batchResult.failed}`,
          details: uploadResult
        }
      
      case 'validate':
        const validateResult = await validateDatabase()
        console.log('验证完成，结果:', validateResult)
        
        return {
          success: validateResult.success,
          message: validateResult.success ? '验证完成' : '验证失败',
          details: validateResult
        }
      
      case 'clear':
        const clearResult = await clearDatabase()
        console.log('清空完成，结果:', clearResult)
        
        return {
          success: clearResult.success,
          message: clearResult.success ? `成功删除 ${clearResult.deleted} 条记录` : '清空失败',
          details: clearResult
        }
      
      default:
        return {
          success: false,
          error: '不支持的操作',
          supportedActions: ['upload', 'validate', 'clear']
        }
    }
    
  } catch (error) {
    console.error('云函数执行失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
} 