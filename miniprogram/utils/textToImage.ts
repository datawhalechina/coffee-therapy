/**
 * 文生图功能模块 - 调用阿里云文生图API
 */

// 调用云函数生成图片
export const generateImage = async (prompt: string, options: any = {}) => {
  try {
    // 默认使用wanx2.1-t2i-plus模型
    const model = options.model || 'wanx2.1-t2i-plus';
    const size = options.size || '1024*1024';
    const n = options.n || 1;
    const negativePrompt = options.negativePrompt || '';
    const promptExtend = options.promptExtend !== false;

    // 调用云函数创建图像生成任务
    const res = await wx.cloud.callFunction({
      name: 'newpic',
      data: {
        name: 'generateImage',
        prompt,
        model,
        size,
        n,
        negativePrompt,
        promptExtend
      }
    });

    return res.result;
  } catch (error) {
    console.error('创建图像任务失败:', error);
    throw error;
  }
};

// 查询任务状态
export const checkTaskStatus = async (taskId: string) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'newpic',
      data: {
        name: 'checkTaskStatus',
        taskId
      }
    });

    return res.result;
  } catch (error) {
    console.error('查询任务状态失败:', error);
    throw error;
  }
};

// 等待任务完成并获取图片结果
export const waitAndGetImage = async (taskId: string) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'newpic',
      data: {
        name: 'waitAndGetImage',
        taskId
      }
    });

    return res.result;
  } catch (error) {
    console.error('获取图片结果失败:', error);
    throw error;
  }
};

// 完整的文生图流程：从提示词到最终图片
export const generateImageComplete = async (prompt: string, options: any = {}) => {
  try {
    // 显示加载提示
    wx.showLoading({
      title: '图片生成中...',
      mask: true
    });

    // 第一步：创建图像生成任务
    const createRes = await generateImage(prompt, options);
    
    if (!createRes.success || !createRes.taskId) {
      wx.hideLoading();
      return {
        success: false,
        error: createRes.error || '创建任务失败'
      };
    }

    // 第二步：等待任务完成并获取图片结果
    const imageRes = await waitAndGetImage(createRes.taskId);
    
    // 隐藏加载提示
    wx.hideLoading();
    
    return imageRes;
  } catch (error) {
    // 隐藏加载提示
    wx.hideLoading();
    
    console.error('完整图片生成流程失败:', error);
    return {
      success: false,
      error: error.message || '图片生成失败'
    };
  }
};
