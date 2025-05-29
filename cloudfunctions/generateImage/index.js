// 云函数入口文件
const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')

cloud.init({
  env: 'cloud1-4gythsnw8615145d'
})

// 从 prompt.json 文件导入提示词模板
let promptData;
try {
  // 读取文件
  const promptFilePath = path.resolve(__dirname, 'prompt.json');
  const promptFile = fs.readFileSync(promptFilePath, 'utf8');
  promptData = JSON.parse(promptFile);
  console.log('成功读取prompt.json文件');
} catch (error) {
  console.error('读取prompt.json文件失败:', error);
  // 如果读取失败，使用默认模板
  promptData = {
    templates: {
      cat: {
        name: '猫咪',
        templates: ['一只可爱的小猫在阳光下']
      }
    },
    variables: {
      colors: ['橙色', '蓝色', '绿色'],
      places: ['花园', '沙发上', '窗台'],
      foods: ['蛋糕', '咖啡', '水果']
    }
  };
}

// 提取模板和变量数据
const themeTemplates = promptData.templates || {};
const colors = promptData.variables?.colors || [];
const places = promptData.variables?.places || [];
const foods = promptData.variables?.foods || [];

// 生成随机提示词
function generatePrompt(template, options = {}) {
  // 替换模板中的变量
  let prompt = template;
  
  // 替换颜色
  if (prompt.includes('{color}')) {
    const color = options.color || colors[Math.floor(Math.random() * colors.length)];
    prompt = prompt.replace('{color}', color);
  }
  
  // 替换地点
  if (prompt.includes('{place}')) {
    const place = options.place || places[Math.floor(Math.random() * places.length)];
    prompt = prompt.replace('{place}', place);
  }
  
  // 替换食物
  if (prompt.includes('{food}')) {
    const food = options.food || foods[Math.floor(Math.random() * foods.length)];
    prompt = prompt.replace('{food}', food);
  }
  
  return prompt;
}

// 生成特定主题的提示词
function generatePromptByTheme(theme, options = {}) {
  // 如果主题不存在，返回默认提示词
  if (!themeTemplates[theme]) {
    return '一只可爱的小猫在阳光下';
  }
  
  // 随机选择一个模板
  const templates = themeTemplates[theme].templates;
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // 生成并返回提示词
  return generatePrompt(template, options);
}

// 批量生成图片任务
async function batchGenerateImages(themes, options = {}) {
  const results = [];
  const db = cloud.database();
  
  // 为每个主题生成任务
  for (const theme of themes) {
    try {
      // 生成提示词
      const prompt = generatePromptByTheme(theme, options);
      
      // 调用newpic云函数生成任务ID
      const result = await cloud.callFunction({
        name: 'newpic',
        data: {
          name: 'generateImageId',
          prompt: prompt,
          model: options.model || 'wanx2.1-t2i-plus',
          negativePrompt: options.negativePrompt || '模糊, 变形, 低质量',
          userId: options.userId
        }
      });
      
      if (result.result.success) {
        // 记录批量任务信息
        try {
          await db.collection('batchImageTasks').add({
            data: {
              batchId: options.batchId || Date.now().toString(),
              taskId: result.result.taskId,
              theme: theme,
              prompt: prompt,
              status: 'pending',
              createTime: db.serverDate(),
              userId: options.userId || cloud.getWXContext().OPENID,
              isTemplatePrompt: options.isTemplatePrompt || false
            }
          });
        } catch (dbError) {
          console.error('记录批量任务到数据库失败:', dbError);
        }
        
        results.push({
          theme: theme,
          themeName: themeTemplates[theme]?.name || theme,
          taskId: result.result.taskId,
          prompt: prompt,
          success: true
        });
      } else {
        results.push({
          theme: theme,
          themeName: themeTemplates[theme]?.name || theme,
          success: false,
          error: result.result.error,
          prompt: prompt
        });
      }
    } catch (error) {
      console.error(`生成主题 ${theme} 的任务失败:`, error);
      results.push({
        theme: theme,
        themeName: themeTemplates[theme]?.name || theme,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

// 为所有模板生成示例图片
async function generateTemplateImages() {
  console.log('开始为所有模板生成示例图片');
  const db = cloud.database();
  const results = [];
  const batchId = 'template_' + Date.now().toString();
  
  // 遍历所有主题
  for (const themeKey of Object.keys(themeTemplates)) {
    const theme = themeTemplates[themeKey];
    
    // 遍历主题中的所有模板
    for (let i = 0; i < theme.templates.length; i++) {
      const templateText = theme.templates[i];
      try {
        // 生成具体的提示词
        const prompt = generatePrompt(templateText);
        
        // 检查是否已经为这个模板生成过图片
        const existingTask = await db.collection('templatePromptImages')
          .where({
            themeKey: themeKey,
            templateIndex: i
          })
          .limit(1)
          .get();
        
        // 如果已存在，则跳过
        if (existingTask.data && existingTask.data.length > 0) {
          console.log(`模板 ${themeKey}[${i}] 已存在图片，跳过`);
          results.push({
            themeKey: themeKey,
            themeName: theme.name,
            templateIndex: i,
            prompt: prompt,
            taskId: existingTask.data[0].taskId,
            status: 'exists'
          });
          continue;
        }
        
        // 调用newpic云函数生成任务ID
        const result = await cloud.callFunction({
          name: 'newpic',
          data: {
            name: 'generateImageId',
            prompt: prompt,
            model: 'wanx2.1-t2i-plus',
            negativePrompt: '模糊, 变形, 低质量'
          }
        });
        
        if (result.result.success) {
          // 将模板和任务ID关联存储
          await db.collection('templatePromptImages').add({
            data: {
              themeKey: themeKey,
              themeName: theme.name,
              templateIndex: i,
              template: templateText,
              prompt: prompt,
              taskId: result.result.taskId,
              batchId: batchId,
              status: 'pending',
              createTime: db.serverDate()
            }
          });
          
          // 也添加到批量任务中
          await db.collection('batchImageTasks').add({
            data: {
              batchId: batchId,
              taskId: result.result.taskId,
              theme: themeKey,
              prompt: prompt,
              status: 'pending',
              createTime: db.serverDate(),
              isTemplatePrompt: true,
              templateIndex: i
            }
          });
          
          results.push({
            themeKey: themeKey,
            themeName: theme.name,
            templateIndex: i,
            prompt: prompt,
            taskId: result.result.taskId,
            status: 'created'
          });
          
          // 每个请求之间暂停一下，避免请求过快
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          results.push({
            themeKey: themeKey,
            themeName: theme.name,
            templateIndex: i,
            prompt: prompt,
            error: result.result.error,
            status: 'failed'
          });
        }
      } catch (error) {
        console.error(`为模板 ${themeKey}[${i}] 生成图片失败:`, error);
        results.push({
          themeKey: themeKey,
          themeName: theme.name,
          templateIndex: i,
          error: error.message,
          status: 'error'
        });
      }
    }
  }
  
  return {
    batchId: batchId,
    results: results,
    total: results.length,
    created: results.filter(r => r.status === 'created').length,
    existing: results.filter(r => r.status === 'exists').length,
    failed: results.filter(r => r.status === 'failed' || r.status === 'error').length
  };
}

// 查询模板图片的状态
async function queryTemplateImagesStatus() {
  console.log('查询模板图片状态');
  const db = cloud.database();
  
  // 获取所有模板图片记录
  const records = await db.collection('templatePromptImages')
    .where({
      status: 'pending'
    })
    .limit(100)
    .get();
  
  if (!records.data || records.data.length === 0) {
    return {
      success: true,
      message: '没有待处理的模板图片任务',
      processed: 0
    };
  }
  
  const results = [];
  for (const record of records.data) {
    try {
      // 调用newpic检查任务状态
      const statusResult = await cloud.callFunction({
        name: 'newpic',
        data: {
          name: 'getImageById',
          taskId: record.taskId
        }
      });
      
      if (statusResult.result.completed) {
        // 更新模板图片记录
        await db.collection('templatePromptImages').doc(record._id).update({
          data: {
            status: 'completed',
            imageUrl: statusResult.result.imageUrl,
            updateTime: db.serverDate()
          }
        });
        
        results.push({
          taskId: record.taskId,
          themeKey: record.themeKey,
          templateIndex: record.templateIndex,
          status: 'completed',
          imageUrl: statusResult.result.imageUrl
        });
      }
      
      // 暂停一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`检查模板图片状态失败: ${record.taskId}`, error);
    }
  }
  
  return {
    success: true,
    processed: results.length,
    completed: results.filter(r => r.status === 'completed').length,
    results: results
  };
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { name, themes, options } = event;
  
  // 根据不同的name参数执行不同的操作
  switch (name) {
    // 批量生成图片任务
    case 'batchGenerate':
      try {
        // 检查themes参数
        if (!themes || !Array.isArray(themes) || themes.length === 0) {
          return {
            success: false,
            error: '缺少有效的themes参数，应为非空数组'
          };
        }
        
        // 限制一次最多生成的数量
        const maxBatchSize = 10;
        const themesToProcess = themes.slice(0, maxBatchSize);
        
        if (themes.length > maxBatchSize) {
          console.log(`请求的主题数量超过限制，仅处理前 ${maxBatchSize} 个`);
        }
        
        // 批量生成图片任务
        const results = await batchGenerateImages(themesToProcess, options || {});
        
        // 生成批次ID，用于后续查询
        const batchId = Date.now().toString();
        
        return {
          success: true,
          batchId: batchId,
          results: results,
          total: results.length,
          successCount: results.filter(r => r.success).length
        };
      } catch (error) {
        console.error('批量生成任务失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
    
    // 自动为所有模板生成图片
    case 'generateTemplateImages':
      try {
        // 不需要任何参数，直接布置所有模板的图片生成任务
        const result = await generateTemplateImages();
        return {
          success: true,
          ...result
        };
      } catch (error) {
        console.error('生成模板图片失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    // 查询模板图片的状态
    case 'queryTemplateImagesStatus':
      try {
        const result = await queryTemplateImagesStatus();
        return {
          success: true,
          ...result
        };
      } catch (error) {
        console.error('查询模板图片状态失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    // 根据主题和模板索引获取图片
    case 'getTemplateImage':
      try {
        const { themeKey, templateIndex } = event;
        if (!themeKey) {
          return {
            success: false,
            error: '缺少themeKey参数'
          };
        }
        
        const db = cloud.database();
        let query = db.collection('templatePromptImages').where({
          themeKey: themeKey,
          status: 'completed'
        });
        
        // 如果指定了模板索引，则精确查询
        if (templateIndex !== undefined) {
          query = query.where({
            templateIndex: Number(templateIndex)
          });
        }
        
        const records = await query.get();
        
        if (!records.data || records.data.length === 0) {
          return {
            success: false,
            message: '没有找到对应的模板图片',
            themeKey,
            templateIndex
          };
        }
        
        // 返回图片记录
        return {
          success: true,
          images: records.data.map(item => ({
            themeKey: item.themeKey,
            themeName: item.themeName,
            templateIndex: item.templateIndex,
            template: item.template,
            prompt: item.prompt,
            taskId: item.taskId,
            imageUrl: item.imageUrl,
            createTime: item.createTime
          }))
        };
      } catch (error) {
        console.error('获取模板图片失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    // 根据批次ID查询所有任务的状态
    case 'queryBatchStatus':
      try {
        const { batchId } = event;
        if (!batchId) {
          return {
            success: false,
            error: '缺少batchId参数'
          };
        }
        
        // 从数据库查询批次任务
        const db = cloud.database();
        const tasks = await db.collection('batchImageTasks')
          .where({
            batchId: batchId
          })
          .get();
        
        // 对每个任务检查状态
        const statusResults = [];
        for (const task of tasks.data) {
          try {
            // 调用newpic检查任务状态
            const statusResult = await cloud.callFunction({
              name: 'newpic',
              data: {
                name: 'getImageById',
                taskId: task.taskId
              }
            });
            
            // 更新数据库中的任务状态
            if (statusResult.result.completed) {
              await db.collection('batchImageTasks').doc(task._id).update({
                data: {
                  status: 'completed',
                  imageUrl: statusResult.result.imageUrl,
                  updateTime: db.serverDate()
                }
              });
            }
            
            statusResults.push({
              taskId: task.taskId,
              theme: task.theme,
              prompt: task.prompt,
              status: statusResult.result.completed ? 'completed' : 'pending',
              imageUrl: statusResult.result.imageUrl || null,
              completed: statusResult.result.completed || false
            });
          } catch (error) {
            statusResults.push({
              taskId: task.taskId,
              theme: task.theme,
              prompt: task.prompt,
              status: 'error',
              error: error.message
            });
          }
        }
        
        return {
          success: true,
          batchId: batchId,
          tasks: statusResults,
          total: statusResults.length,
          completedCount: statusResults.filter(t => t.status === 'completed').length
        };
      } catch (error) {
        console.error('查询批次状态失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
    // 获取支持的所有主题
    case 'getThemes':
      try {
        const themes = Object.keys(themeTemplates).map(key => ({
          id: key,
          name: themeTemplates[key].name,
          samplePrompt: generatePromptByTheme(key)
        }));
        
        return {
          success: true,
          themes: themes
        };
      } catch (error) {
        console.error('获取主题列表失败:', error);
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