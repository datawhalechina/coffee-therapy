// color-select/index.ts

interface ColorItem {
  name: string;
  gradient: string;
  meaning: string;
}

interface ComponentData {
  selectedColor: number;
  colors: ColorItem[];
  isLoading: boolean;
  loadingText: string;
  cloudEnvId: string;
}

interface CardData {
  color: string;
  quote?: string;
  imageTaskId?: string;
}

Component({
  data: {
    selectedColor: -1, // -1 表示未选择任何颜色
    colors: [
      {
        name: "蓝色",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        meaning: "平静、稳定、信任。蓝色能给人带来宁静和放松的感觉，有助于缓解压力。"
      },
      {
        name: "红色",
        gradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
        meaning: "热情、力量、激励。红色代表活力和热情，能够激发您的内在动力。"
      },
      {
        name: "绿色",
        gradient: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
        meaning: "成长、和谐、平衡。绿色象征着自然和新生，能够带来平衡与和谐感。"
      },
      {
        name: "黄色",
        gradient: "linear-gradient(135deg, #fcb045 0%, #fd1d1d 100%)",
        meaning: "快乐、创造力、乐观。黄色能够带来阳光般的温暖，激发创造力和希望。"
      },
      {
        name: "紫色",
        gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        meaning: "神秘、智慧、灵感。紫色与高贵和深度思考相关，能够激发直觉和创造力。"
      },
      {
        name: "橙色",
        gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
        meaning: "活力、温暖、友善。橙色代表着友好和社交，能够带来愉悦感。"
      },
      {
        name: "粉色",
        gradient: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
        meaning: "爱、温柔、关怀。粉色象征着温柔与关爱，能够带来舒适和安全感。"
      },
      {
        name: "灰色",
        gradient: "linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)",
        meaning: "中立、平衡、冷静。灰色代表着中立与沉稳，有助于保持情绪的平衡。"
      },
      {
        name: "黑色",
        gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        meaning: "力量、优雅、神秘。黑色象征着力量与深度，能够帮助您发现内心的坚韧。"
      }
    ],
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: 'cloud1-4gythsnw8615145d' // 云环境ID
  } as ComponentData,
  
  methods: {
    // 选择颜色
    selectColor(e: any) {
      try {
        const index = e.currentTarget.dataset.index;
        const self = this as any;
        self.setData({
          selectedColor: index
        });
        console.log('颜色已选择:', index, self.data.colors[index].name);
      } catch (error) {
        console.error('选择颜色时出错:', error);
      }
    },
    
    // 生成卡片并跳转到结果页
    generateCard() {
      try {
        const self = this as any;
        if (self.data.selectedColor === -1) {
          wx.showToast({
            title: '请选择一种颜色',
            icon: 'none'
          });
          return;
        }
        
        const selectedColor = self.data.colors[self.data.selectedColor];
        
        self.setData({
          isLoading: true,
          loadingText: '正在生成您的疗愈卡片...'
        });
        
        // 创建一个对象存储云函数返回的数据
        const cardData: CardData = {
          color: selectedColor.name
        };
        
        // 第一步：调用 chatgpt 云函数生成文本
        wx.cloud.callFunction({
          name: 'chatgpt',
          data: {
            name: 'sendMessage',
            message: `根据${selectedColor.name}的特性，给我一段30字以内的疗愈文字。${selectedColor.meaning}`,
            sessionId: 'color_card_generation_' + Date.now(),
            model: 'deepseek-v3',
            temperature: 0.7,
            max_tokens: 300
          },
          success: res => {
            console.log('文本生成成功：', res);
            
            const result = res.result as {
              success: boolean;
              reply: string;
            };
            
            if (result && result.success) {
              // 获取AI生成的回复
              const aiReply = result.reply;
              cardData.quote = encodeURIComponent(aiReply);
              
              // 第二步：调用 newpic 云函数生成图片
              const imagePrompt = `生成一张体现${selectedColor.name}色调的温暖提升友善温馨的插画，风格简约现代，色调以${selectedColor.name}为主`; // 生成图片的提示词
              
              wx.cloud.callFunction({
                name: 'newpic',
                data: {
                  name: 'generateImageId',
                  prompt: imagePrompt,
                  model: 'wanx2.1-t2i-plus',
                  size: '1024*1024'
                },
                success: picRes => {
                  console.log('图片任务创建成功：', picRes);
                  
                  const picResult = picRes.result as {
                    success: boolean;
                    taskId: string;
                  };
                  
                  if (picResult && picResult.success) {
                    // 获取图片任务ID
                    const imageTaskId = picResult.taskId;
                    cardData.imageTaskId = imageTaskId;
                    
                    // 跳转到结果页并传递所有参数
                    self.navigateToCardResult(cardData);
                  } else {
                    // 图片生成失败，但仍然使用文本跳转
                    console.error('图片生成失败，仅使用文本跳转:', picRes.result);
                    self.navigateToCardResult(cardData);
                  }
                },
                fail: picErr => {
                  console.error('图片云函数调用失败：', picErr);
                  // 图片生成失败，但仍然使用文本跳转
                  self.navigateToCardResult(cardData);
                }
              });
            } else {
              // 处理文本生成错误情况
              wx.showToast({
                title: '生成失败，请重试',
                icon: 'none',
                duration: 2000
              });
              self.setData({
                isLoading: false,
                loadingText: ''
              });
            }
          },
          fail: err => {
            console.error('文本云函数调用失败：', err);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none',
              duration: 2000
            });
            self.setData({
              isLoading: false,
              loadingText: ''
            });
          }
        });
      } catch (error) {
        console.error('生成卡片时出错:', error);
        wx.showToast({
          title: '系统错误，请重试',
          icon: 'none'
        });
        const self = this as any;
        self.setData({
          isLoading: false,
          loadingText: ''
        });
      }
    },
    
    // 跳转到卡片结果页
    navigateToCardResult(cardData: CardData) {
      try {
        const self = this as any;
        // 构建跳转 URL
        let url = `/pages/card-result/index?color=${cardData.color}`;
        
        // 如果有AI生成的引用文本，添加到URL
        if (cardData.quote) {
          url += `&quote=${cardData.quote}`;
        }
        
        // 如果有图片任务ID，添加到URL
        if (cardData.imageTaskId) {
          url += `&imageTaskId=${cardData.imageTaskId}`;
        }
        
        console.log('准备跳转到:', url);
        
        // 执行跳转
        wx.navigateTo({
          url: url,
          success: () => {
            console.log('成功跳转到卡片结果页');
          },
          fail: (err) => {
            console.error('跳转失败:', err);
            wx.showToast({
              title: '跳转失败，请重试',
              icon: 'none'
            });
          },
          complete: () => {
            // 重置加载状态
            self.setData({
              isLoading: false,
              loadingText: ''
            });
          }
        });
      } catch (error) {
        console.error('跳转结果页时出错:', error);
        const self = this as any;
        self.setData({
          isLoading: false,
          loadingText: ''
        });
      }
    }
  },
  
  lifetimes: {
    attached() {
      try {
        const self = this as any;
        // 初始化云环境
        if (!wx.cloud) {
          console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
          wx.cloud.init({
            env: self.data.cloudEnvId,
            traceUser: true,
          });
          console.log('云环境初始化成功！');
        }
      } catch (error) {
        console.error('组件初始化时出错:', error);
      }
    }
  }
});
