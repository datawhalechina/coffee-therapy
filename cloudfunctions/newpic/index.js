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
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

// 创建任务获取任务ID
async function createImageTask(prompt, model = 'wanx2.1-t2i-plus', size = '1024*1024', n = 1, negativePrompt = '', promptExtend = true) {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      headers: {
        'X-DashScope-Async': 'enable',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: model,
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt
        },
        parameters: {
          size: size,
          n: n,
          prompt_extend: promptExtend,
          watermark: false
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('创建图像任务失败:', error.response ? error.response.data : error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

// 根据任务ID查询结果
async function checkTaskStatus(taskId) {
  try {
    const response = await axios({
      method: 'get',
      url: `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('查询任务状态失败:', error.response ? error.response.data : error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

// 等待任务完成
async function waitForTaskCompletion(taskId, maxAttempts = 30, interval = 5000) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const taskResult = await checkTaskStatus(taskId);
    const status = taskResult.output.task_status;
    
    if (status === 'SUCCEEDED') {
      return taskResult;
    } else if (status === 'FAILED' || status === 'CANCELED') {
      throw new Error(`任务失败: ${JSON.stringify(taskResult)}`);
    }
    
    // 如果任务仍在处理中，等待一段时间后再次检查
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  throw new Error('任务超时');
}

// 将图片URL保存到云存储
async function saveImageToCloud(imageUrl, fileName) {
  try {
    console.log('开始下载图片:', imageUrl);
    // 下载图片
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });
    console.log('图片下载成功，大小:', response.data.length, '字节');

    // 确保云存储文件夹存在 (注意：在微信云开发中，文件夹不需要预先创建，这一步是记录日志用)
    const folderPath = 'generated_images';
    console.log(`准备上传到云存储路径: ${folderPath}/${fileName}`);

    // 上传到云存储
    try {
      const result = await cloud.uploadFile({
        cloudPath: `${folderPath}/${fileName}`,
        fileContent: response.data,
      });
      console.log('上传成功，文件ID:', result.fileID);

      // 获取文件访问链接
      const fileList = [result.fileID];
      try {
        const fileURLs = await cloud.getTempFileURL({
          fileList: fileList,
        });
        console.log('获取临时链接成功:', fileURLs.fileList[0].tempFileURL);
        return fileURLs.fileList[0].tempFileURL;
      } catch (urlError) {
        console.error('获取临时URL失败:', urlError);
        // 即使获取临时URL失败，也返回fileID
        return result.fileID;
      }
    } catch (uploadError) {
      console.error('上传文件失败:', uploadError);
      throw uploadError;
    }
  } catch (error) {
    console.error('保存图片到云存储完整错误:', error);
    if (error.response) {
      console.error('API响应状态:', error.response.status);
      console.error('API响应头:', JSON.stringify(error.response.headers));
    }
    // 返回错误但不中断流程
    return {
      error: true,
      message: '保存图片到云存储失败: ' + error.message
    };
  }
}

// 保存生成记录到数据库
async function saveGenerationRecord(data) {
  try {
    const db = cloud.database();
    const result = await db.collection('generatedImages').add({
      data: {
        userId: data.userId || cloud.getWXContext().OPENID,
        prompt: data.prompt,
        negativePrompt: data.negativePrompt || '',
        imageUrl: data.imageUrl,
        originalUrl: data.originalUrl,
        taskId: data.taskId,
        model: data.model,
        createTime: db.serverDate(),
        status: data.status || 'success'
      }
    });
    console.log('记录已保存到数据库, _id:', result._id);
    return result._id;
  } catch (error) {
    console.error('保存记录到数据库失败:', error);
    return null;
  }
}

// 完整的生成图片流程（一次性完成所有步骤）
async function generateImageComplete(params) {
  try {
    console.log('开始完整图片生成流程，参数:', JSON.stringify(params));
    
    // 第一步：创建图像生成任务
    const taskResponse = await createImageTask(
      params.prompt, 
      params.model || 'wanx2.1-t2i-plus', 
      params.size || '1024*1024', 
      params.n || 1, 
      params.negativePrompt || '', 
      params.promptExtend !== false
    );
    
    const taskId = taskResponse.output.task_id;
    console.log('任务已创建，任务ID:', taskId);
    
    // 第二步：等待任务完成并获取结果
    console.log('等待任务完成...');
    const taskResult = await waitForTaskCompletion(taskId);
    console.log('任务已完成，状态:', taskResult.output.task_status);
    
    if (taskResult.output.results && taskResult.output.results.length > 0) {
      // 获取图片URL
      const imageUrl = taskResult.output.results[0].url;
      console.log('获取到图片URL:', imageUrl);
      
      // 生成文件名
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
      
      // 保存到云存储
      console.log('开始保存到云存储...');
      const cloudImageUrl = await saveImageToCloud(imageUrl, fileName);
      
      // 处理可能的云存储错误
      let finalImageUrl = imageUrl;
      let cloudError = null;
      
      if (cloudImageUrl && cloudImageUrl.error) {
        console.log('云存储保存失败，使用原始URL');
        cloudError = cloudImageUrl.message;
      } else {
        finalImageUrl = cloudImageUrl;
        console.log('图片已保存到云存储:', finalImageUrl);
      }
      
      // 保存记录到数据库
      const recordData = {
        userId: params.userId,
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        imageUrl: finalImageUrl,
        originalUrl: imageUrl,
        taskId: taskId,
        model: params.model || 'wanx2.1-t2i-plus',
      };
      
      const recordId = await saveGenerationRecord(recordData);
      console.log('生成记录已保存，ID:', recordId);
      
      return {
        success: true,
        taskId: taskId,
        imageUrl: finalImageUrl,
        originalUrl: imageUrl,
        cloudError: cloudError,
        recordId: recordId
      };
    } else {
      console.log('没有找到生成的图片');
      return {
        success: false,
        error: '没有找到生成的图片',
        taskId: taskId
      };
    }
  } catch (error) {
    console.error('完整图片生成流程失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 处理定时触发的图片生成任务
async function handleScheduledTasks() {
  try {
    console.log('开始处理定时图片生成任务');
    const db = cloud.database();
    
    // 查询待处理的任务
    const tasks = await db.collection('imageGenTasks')
      .where({
        status: 'pending' // 查询状态为待处理的任务
      })
      .limit(5) // 每次最多处理5个任务
      .get();
    
    console.log(`找到 ${tasks.data.length} 个待处理任务`);
    
    if (tasks.data.length === 0) {
      return {
        success: true,
        message: '没有待处理的任务'
      };
    }
    
    // 处理每个任务
    const results = [];
    for (const task of tasks.data) {
      console.log('处理任务:', task._id);
      
      // 更新任务状态为处理中
      await db.collection('imageGenTasks').doc(task._id).update({
        data: {
          status: 'processing',
          processingTime: db.serverDate()
        }
      });
      
      try {
        // 执行完整的图片生成流程
        const result = await generateImageComplete({
          prompt: task.prompt,
          negativePrompt: task.negativePrompt,
          model: task.model,
          size: task.size,
          userId: task.userId
        });
        
        // 更新任务状态为完成
        await db.collection('imageGenTasks').doc(task._id).update({
          data: {
            status: result.success ? 'completed' : 'failed',
            completionTime: db.serverDate(),
            result: result
          }
        });
        
        results.push({
          taskId: task._id,
          success: result.success,
          result: result
        });
      } catch (error) {
        console.error('处理任务失败:', task._id, error);
        
        // 更新任务状态为失败
        await db.collection('imageGenTasks').doc(task._id).update({
          data: {
            status: 'failed',
            completionTime: db.serverDate(),
            error: error.message
          }
        });
        
        results.push({
          taskId: task._id,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      processed: results.length,
      results: results
    };
  } catch (error) {
    console.error('定时任务处理失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  // 检查是否由定时触发器触发
  if (event.Type === 'Timer') {
    return await handleScheduledTasks();
  }
  
  const { name, prompt, model, size, n, negativePrompt, promptExtend, userId, taskId } = event;
  console.log('收到请求，操作类型:', name);

  // 根据不同的name参数执行不同的操作
  switch (name) {
    // 仅生成任务ID，不等待结果
    case 'generateImageId':
      try {
        if (!prompt) {
          return {
            success: false,
            error: '缺少提示词'
          };
        }
        
        console.log('创建文生图任务, 提示词:', prompt);
        const modelName = model || 'wanx2.1-t2i-plus';
        console.log('使用模型:', modelName);
        
        // 创建图像生成任务
        const taskResponse = await createImageTask(
          prompt, 
          modelName, 
          size || '1024*1024', 
          n || 1, 
          negativePrompt || '', 
          promptExtend !== false
        );
        
        const taskId = taskResponse.output.task_id;
        console.log('任务创建成功, ID:', taskId);
        
        // 在数据库中记录任务
        try {
          const db = cloud.database();
          await db.collection('imageGenTasks').add({
            data: {
              taskId: taskId,
              prompt: prompt,
              negativePrompt: negativePrompt || '',
              model: modelName,
              size: size || '1024*1024',
              userId: userId || cloud.getWXContext().OPENID,
              status: 'pending',
              createTime: db.serverDate()
            }
          });
          console.log('任务已记录到数据库');
        } catch (dbError) {
          console.error('记录到数据库失败:', dbError);
          // 数据库记录失败不影响返回任务ID
        }
        
        return {
          success: true,
          taskId: taskId,
          message: '图像生成任务已创建'
        };
      } catch (error) {
        console.error('创建任务失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
    
    // 根据任务ID获取图片
    case 'getImageById':
      try {
        if (!taskId) {
          return {
            success: false,
            error: '缺少任务ID'
          };
        }
        
        console.log('获取图片, 任务ID:', taskId);
        
        // 检查任务状态
        const taskResult = await checkTaskStatus(taskId);
        const status = taskResult.output.task_status;
        console.log('任务状态:', status);
        
        if (status !== 'SUCCEEDED') {
          // 任务未完成，返回当前状态
          return {
            success: true,
            completed: false,
            status: status,
            message: '任务还未完成'
          };
        }
        
        // 任务已完成，获取图片URL
        if (taskResult.output.results && taskResult.output.results.length > 0) {
          const imageUrl = taskResult.output.results[0].url;
          console.log('获取到生成图片URL:', imageUrl);
          
          // 生成唯一文件名
          const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
          
          try {
            // 保存到云存储
            console.log('开始保存图片到云存储');
            const cloudImageUrl = await saveImageToCloud(imageUrl, fileName);
            
            // 在数据库中记录生成结果
            try {
              const db = cloud.database();
              await db.collection('generatedImages').add({
                data: {
                  taskId: taskId,
                  imageUrl: cloudImageUrl && cloudImageUrl.error ? imageUrl : cloudImageUrl,
                  originalUrl: imageUrl,
                  userId: userId || cloud.getWXContext().OPENID,
                  createTime: db.serverDate(),
                  prompt: taskResult.output.results[0].orig_prompt || '',
                  actualPrompt: taskResult.output.results[0].actual_prompt || ''
                }
              });
              console.log('图片记录已保存到数据库');
            } catch (dbError) {
              console.error('保存图片记录失败:', dbError);
            }
            
            // 如果云存储出错，返回原始 URL
            if (cloudImageUrl && cloudImageUrl.error) {
              console.log('云存储失败，返回原始 URL');
              return {
                success: true,
                completed: true,
                imageUrl: imageUrl,
                cloudUrl: null,
                cloudError: cloudImageUrl.message,
                origPrompt: taskResult.output.results[0].orig_prompt,
                actualPrompt: taskResult.output.results[0].actual_prompt
              };
            }
            
            // 成功流程
            console.log('完成图片获取和保存');
            return {
              success: true,
              completed: true,
              imageUrl: cloudImageUrl,  // 主要返回云存储URL
              originalUrl: imageUrl,     // 也返回原始URL作为备用
              origPrompt: taskResult.output.results[0].orig_prompt,
              actualPrompt: taskResult.output.results[0].actual_prompt
            };
          } catch (storageError) {
            console.error('保存到云存储时发生错误:', storageError);
            // 即使云存储失败，也返回原始图片URL
            return {
              success: true,
              completed: true,
              imageUrl: imageUrl,
              cloudError: storageError.message,
              origPrompt: taskResult.output.results[0].orig_prompt,
              actualPrompt: taskResult.output.results[0].actual_prompt
            };
          }
        } else {
          console.log('没有找到生成的图片');
          return {
            success: false,
            error: '没有找到生成的图片'
          };
        }
      } catch (error) {
        console.error('获取图片失败:', error);
        return {
          success: false,
          error: error.message
        };
      }
    
    // 定时处理的接口，用于后台定期检查任务状态
    case 'checkPendingTasks':
      try {
        const db = cloud.database();
        // 查询数据库中状态为 pending 的任务
        const tasks = await db.collection('imageGenTasks')
          .where({
            status: 'pending'
          })
          .limit(10)
          .get();
          
        console.log(`找到 ${tasks.data.length} 个待处理任务`);
        
        const processedTasks = [];
        for (const task of tasks.data) {
          // 仅检查任务状态，不下载图片
          const taskResult = await checkTaskStatus(task.taskId);
          const status = taskResult.output.task_status;
          
          await db.collection('imageGenTasks').doc(task._id).update({
            data: {
              status: status === 'SUCCEEDED' ? 'completed' : 
                     status === 'FAILED' ? 'failed' : 
                     status === 'CANCELED' ? 'canceled' : 'processing',
              lastCheckTime: db.serverDate(),
              apiStatus: status
            }
          });
          
          processedTasks.push({
            taskId: task.taskId,
            status: status
          });
        }
        
        return {
          success: true,
          processedTasks: processedTasks
        };
      } catch (error) {
        console.error('检查待处理任务失败:', error);
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
