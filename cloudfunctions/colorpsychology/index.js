// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV,
    traceUser: true
})

// 获取API密钥
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

// 基础颜色映射表
const BASE_COLORS = ['红', '橙', '黄', '绿', '青', '蓝', '紫']

// 情绪与颜色的映射规则
const EMOTION_COLOR_MAPPING = {
  // 红色相关情绪
  '愤怒': '红', '激情': '红', '热情': '红', '兴奋': '红', '紧张': '红', 
  '焦虑': '红', '恼火': '红', '生气': '红', '愤慨': '红',
  
  // 橙色相关情绪
  '活力': '橙', '温暖': '橙', '友善': '橙', '热心': '橙', '积极': '橙',
  '乐观': '橙', '朝气': '橙', '活泼': '橙',
  
  // 黄色相关情绪
  '快乐': '黄', '喜悦': '黄', '开心': '黄', '欢乐': '黄', '愉快': '黄',
  '阳光': '黄', '明亮': '黄', '乐观': '黄', '希望': '黄',
  
  // 绿色相关情绪
  '平静': '绿', '安宁': '绿', '和谐': '绿', '舒适': '绿', '放松': '绿',
  '自然': '绿', '成长': '绿', '平衡': '绿', '稳定': '绿', '希望': '绿',
  
  // 青色相关情绪
  '清新': '青', '冷静': '青', '理智': '青', '安静': '青', '沉思': '青',
  '思考': '青', '深沉': '青', '专注': '青', '深度': '青',
  
  // 蓝色相关情绪
  '平和': '蓝', '宁静': '蓝', '安定': '蓝', '沉稳': '蓝', '深思': '蓝',
  '信任': '蓝', '忠诚': '蓝', '可靠': '蓝', '诚实': '蓝', '冷静': '蓝',
  
  // 紫色相关情绪
  '神秘': '紫', '优雅': '紫', '高贵': '紫', '浪漫': '紫', '创意': '紫',
  '梦幻': '紫', '神秘': '紫', '想象': '紫', '灵感': '紫', '直觉': '紫'
}

// 颜色含义映射
const COLOR_MEANING = {
  '红': '激情、热情与活力',
  '橙': '温暖、友善与积极',
  '黄': '快乐、乐观与希望',
  '绿': '平静、和谐与成长',
  '青': '清新、冷静与专注',
  '蓝': '宁静、信任与可靠',
  '紫': '创意、神秘与直觉'
}

// 调用阿里云DashScope API进行聊天补全
async function chatCompletion(messages, model = 'deepseek-v3', temperature =1.0, max_tokens = 1000) {
  try {
    console.log('调用DashScope API开始，模型:', model);
    
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
      timeout: 50000 // 50秒超时
    });
    
    console.log('DashScope API 响应成功，请求ID:', response.headers['x-request-id'] || '未知');
    return response.data;
  } catch (error) {
    console.error('DashScope API调用失败:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    
    throw new Error(`DashScope API调用失败: ${error.message}`);
  }
}

// 从文本分析情绪并确定颜色
async function analyzeEmotionAndDetermineColor(text) {
  try {
    // 1. 首先尝试使用大模型分析情绪和颜色
    const messages = [
      {
        role: "system",
        content: `你是一个心理分析专家，负责从文本中分析用户的心理状态，并匹配到最合适的颜色。
        根据用户输入的文本，判断用户的心理状态对应的颜色，颜色选择范围是：红、橙、黄、绿、青、蓝、紫中的一种。
        你只需要回复单一颜色名称，不要有任何其他输出。例如："红"、"蓝"等。`
      },
      {
        role: "user",
        content: text
      }
    ];

    const response = await chatCompletion(messages);
    const predictedColor = response.choices[0].message.content.trim();
    
    // 如果是有效颜色则使用模型预测结果
    if (BASE_COLORS.includes(predictedColor)) {
      console.log(`大模型预测颜色: ${predictedColor}`);
      return predictedColor;
    }
    
    // 2. 如果大模型返回无效颜色，使用关键词匹配
    console.log('大模型返回无效颜色，尝试关键词匹配');
    return determineColorByKeywords(text);
  } catch (error) {
    console.error('使用大模型分析情绪失败:', error);
    // 3. 如果API调用失败，回退到关键词匹配
    return determineColorByKeywords(text);
  }
}

// 使用关键词匹配确定颜色
function determineColorByKeywords(text) {
  // 对每种基础颜色计算匹配得分
  const colorScores = {};
  BASE_COLORS.forEach(color => colorScores[color] = 0);
  
  // 扫描文本中的情绪关键词并计算得分
  Object.entries(EMOTION_COLOR_MAPPING).forEach(([emotion, color]) => {
    if (text.includes(emotion)) {
      colorScores[color] += 1;
    }
  });
  
  // 获取得分最高的颜色
  let maxScore = 0;
  let selectedColor = BASE_COLORS[0]; // 默认红色
  
  Object.entries(colorScores).forEach(([color, score]) => {
    if (score > maxScore) {
      maxScore = score;
      selectedColor = color;
    }
  });
  
  // 如果没有匹配到情绪关键词，使用基于字符的简单算法
  if (maxScore === 0) {
    const charCode = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    selectedColor = BASE_COLORS[charCode % BASE_COLORS.length];
  }
  
  console.log(`关键词匹配颜色: ${selectedColor}`);
  return selectedColor;
}

// 从颜色数据中获取颜色
async function getColorData(baseColor) {
  try {
    const db = cloud.database();
    
    // 尝试从数据库获取颜色配置
    const colorDataResult = await db.collection('colorMatch').limit(1).get();
    
    if (colorDataResult.data && colorDataResult.data.length > 0) {
      const colorData = colorDataResult.data[0];
      if (colorData[baseColor] && colorData[baseColor].length > 0) {
        // 随机选择该基础颜色下的一种具体颜色
        const randomIndex = Math.floor(Math.random() * colorData[baseColor].length);
        const selectedColor = colorData[baseColor][randomIndex];
        
        // 添加颜色含义
        selectedColor.meaning = COLOR_MEANING[baseColor] || '';
        return selectedColor;
      }
    }
    
    // 从文件读取颜色数据
    const fs = require('fs');
    const colorFilePath = path.join(__dirname, 'color_meach.json');
    
    if (fs.existsSync(colorFilePath)) {
      const colorJson = JSON.parse(fs.readFileSync(colorFilePath, 'utf8'));
      
      if (colorJson[baseColor] && colorJson[baseColor].length > 0) {
        // 随机选择该基础颜色下的一种具体颜色
        const randomIndex = Math.floor(Math.random() * colorJson[baseColor].length);
        const selectedColor = colorJson[baseColor][randomIndex];
        
        // 添加颜色含义
        selectedColor.meaning = COLOR_MEANING[baseColor] || '';
        return selectedColor;
      }
    }
    
    // 如果无法获取颜色数据，返回默认值
    console.log('无法获取颜色数据，使用默认值');
    return {
      name: baseColor,
      hex: "#000000",
      name_en: baseColor,
      category: "未知",
      meaning: COLOR_MEANING[baseColor] || ''
    };
  } catch (error) {
    console.error('获取颜色数据失败:', error);
    return {
      name: baseColor,
      hex: "#000000",
      name_en: baseColor,
      category: "未知",
      meaning: COLOR_MEANING[baseColor] || ''
    };
  }
}

// 生成行动肯定短语
async function generateAffirmation(selectedColor) {
  try {
    const prompt = `你是一位职场能量疗愈师，基于${selectedColor.name}（${selectedColor.meaning}），生成<10字的行动肯定短语。要求：
1. 中文示例风格："深呼吸，放轻松。你比自己想象的更强大" 
2. 英文示例风格："Release the pressure, you are enough"
3. 必须为 **纯中文** 或 **纯英文** ，禁止中英混杂
4. 用"你/你的"或泛称句式传递无条件的支持
5. 除了一句话之外其他都不输出`;

    const messages = [
      {
        role: "system",
        content: "你是一位积极向上、充满能量的职场疗愈师，擅长创作简短有力的肯定短语。"
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await chatCompletion(messages, 'deepseek-v3', 0.7, 100);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('生成肯定短语失败:', error);
    // 根据颜色返回默认短语
    const defaultAffirmations = {
      '红': '燃烧热情 Go!',
      '橙': '向阳而生',
      '黄': '闪耀光芒',
      '绿': '稳步前行',
      '青': '沉着聚焦',
      '蓝': '坚定前进',
      '紫': '创造奇迹'
    };
    
    return defaultAffirmations[selectedColor.name] || '勇往直前!';
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { name, text, baseColor, selectedColor } = event;
  
  // 根据不同的name参数执行不同的操作
  switch (name) {
    // 分析文本并返回匹配的颜色
    case 'analyzeColor':
      try {
        if (!text) {
          return {
            success: false,
            error: '缺少文本内容'
          };
        }
        
        console.log('开始分析文本:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        // 1. 分析情绪并确定颜色
        const baseColor = await analyzeEmotionAndDetermineColor(text);
        console.log('确定的基础颜色:', baseColor);
        
        // 2. 获取具体颜色数据
        const selectedColor = await getColorData(baseColor);
        console.log('选择的具体颜色:', JSON.stringify(selectedColor));
        
        return {
          success: true,
          baseColor: baseColor,
          selectedColor: selectedColor
        };
      } catch (error) {
        console.error('颜色分析失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    // 基于颜色生成肯定短语
    case 'generateAffirmation':
      try {
        if (!selectedColor) {
          return {
            success: false,
            error: '缺少颜色数据'
          };
        }
        
        console.log('开始为颜色生成肯定短语:', selectedColor.name);
        
        // 生成肯定短语
        const affirmation = await generateAffirmation(selectedColor);
        console.log('生成的肯定短语:', affirmation);
        
        return {
          success: true,
          baseColor: baseColor || selectedColor.category === '暖色系' ? '红' : '蓝',
          selectedColor: selectedColor,
          affirmation: affirmation
        };
      } catch (error) {
        console.error('生成肯定短语失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    // 全功能模式：一次性完成所有分析和生成
    case 'complete':
    default:
      try {
        if (!text) {
          return {
            success: false,
            error: '缺少文本内容'
          };
        }
        
        console.log('开始处理用户文本:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        // 1. 分析情绪并确定颜色
        const baseColor = await analyzeEmotionAndDetermineColor(text);
        console.log('确定的基础颜色:', baseColor);
        
        // 2. 获取具体颜色数据
        const selectedColor = await getColorData(baseColor);
        console.log('选择的具体颜色:', JSON.stringify(selectedColor));
        
        // 3. 生成肯定短语
        const affirmation = await generateAffirmation(selectedColor);
        console.log('生成的肯定短语:', affirmation);
        
        return {
          success: true,
          baseColor: baseColor,
          selectedColor: selectedColor,
          affirmation: affirmation
        };
      } catch (error) {
        console.error('处理失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
  }
}
