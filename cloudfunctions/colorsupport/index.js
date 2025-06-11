// 云函数入口文件
const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 读取颜色数据文件
const colorData = JSON.parse(fs.readFileSync(path.join(__dirname, 'color.json'), 'utf8'))
const colorMeachData = JSON.parse(fs.readFileSync(path.join(__dirname, 'color_meach.json'), 'utf8'))

/**
 * 根据用户输入颜色名称查找对应的颜色组合
 * @param {string} colorName - 用户输入的颜色名称
 * @returns {Object|null} - 找到的颜色组合或null
 */
function findColorByName(colorName) {
  // 精确匹配中文或英文颜色名称
  const exactMatch = colorData.find(item => 
    item.color_name === colorName || 
    item.color_name_en.toLowerCase() === colorName.toLowerCase()
  )
  
  if (exactMatch) {
    return exactMatch
  }
  
  // 在color_meach.json中查找类别
  for (const category in colorMeachData) {
    // 首先检查类别名称是否匹配
    if (category === colorName) {
      // 随机返回该类别中的一个颜色
      const randomIndex = Math.floor(Math.random() * colorMeachData[category].length)
      const selectedColor = colorMeachData[category][randomIndex]
      
      // 在colorData中找到对应的背景和文字颜色
      return colorData.find(item => item.color_name === selectedColor.name)
    }
    
    // 检查该类别下的具体颜色
    const matchInCategory = colorMeachData[category].find(item => 
      item.name === colorName || 
      item.name_en.toLowerCase() === colorName.toLowerCase()
    )
    
    if (matchInCategory) {
      return colorData.find(item => item.color_name === matchInCategory.name)
    }
  }
  
  return null
}

/**
 * 获取随机颜色组合
 * @returns {Object} - 随机颜色组合
 */
function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * colorData.length)
  return colorData[randomIndex]
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { colorName } = event
  
  // 如果有输入颜色名，查找对应颜色
  if (colorName && colorName.trim() !== '') {
    const result = findColorByName(colorName.trim())
    
    if (result) {
      return {
        success: true,
        data: result
      }
    } else {
      // 找不到对应颜色时返回错误信息
      return {
        success: false,
        message: '未找到匹配的颜色',
        data: getRandomColor() // 仍然返回一个随机颜色作为备选
      }
    }
  } 
  
  // 如果没有输入颜色名，返回随机颜色
  return {
    success: true,
    data: getRandomColor()
  }
}
