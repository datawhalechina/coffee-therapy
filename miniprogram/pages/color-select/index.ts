// color-select/index.ts
import config from '../../config/env';

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
  backgroundColor?: string;
  textColor?: string;
}

Component({
  data: {
    selectedColor: -1, // -1 表示未选择任何颜色
    colors: [
      {
        name: "蓝色",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        meaning: "当下心情：焦虑或压力。需要安抚：寻求平静和放松，缓解紧张感。"
      },
      {
        name: "红色",
        gradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
        meaning: "当下心情：缺乏活力或疲惫。需要安抚：寻求热情和激励，重燃内在动力。"
      },
      {
        name: "绿色",
        gradient: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
        meaning: "当下心情：不平衡或紧张。需要安抚：寻求和谐与新生，恢复身心平衡。"
      },
      {
        name: "黄色",
        gradient: "linear-gradient(135deg, #fcb045 0%, #fd1d1d 100%)",
        meaning: "当下心情：忧郁或缺乏希望。需要安抚：寻求快乐和创造力，点燃乐观精神。"
      },
      {
        name: "紫色",
        gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        meaning: "当下心情：迷茫或缺乏灵感。需要安抚：寻求智慧和深度思考，激发内在直觉。"
      },
      {
        name: "橙色",
        gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
        meaning: "当下心情：孤立或缺乏温暖。需要安抚：寻求活力和友善，带来社交愉悦感。"
      },
      {
        name: "粉色",
        gradient: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
        meaning: "当下心情：不安或缺乏关爱。需要安抚：寻求温柔和安全感，获得舒适关怀。"
      },
      {
        name: "灰色",
        gradient: "linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)",
        meaning: "当下心情：情绪波动或不确定。需要安抚：寻求冷静和中立，稳定内心平衡。"
      },
      {
        name: "黑色",
        gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        meaning: "当下心情：脆弱或缺乏力量。需要安抚：寻求深度和优雅，增强内在坚韧。"
      }
    ],
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: config.cloudEnv // 云环境ID
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
          loadingText: '正在生成您的专属卡片...'
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
            message: `你是一位擅长写意境诗句的心灵导师。基于用户选择的颜色寓意：${selectedColor.meaning}，请创作一句富有诗意的话，要求：
1. 字数不超过30字
2. 以"愿你"、"总会"、"相信"等词开头
3. 将颜色的象征意义与人生感悟相结合
4. 表达温暖而有力量
5. 能给职场人带来心灵的触动和启发
6. 只输出这一句话，不要其他内容`,
            sessionId: 'color_' + Date.now(),
            model: 'deepseek-v3',
            temperature: 0.7,
            max_tokens: 150
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

              // 第二步：调用 colorpsychology 云函数生成颜色
              wx.cloud.callFunction({
                name: 'colorpsychology',
                data: {
                  text: `用户选择了颜色：${selectedColor.name}，含义：${selectedColor.meaning}`
                },
                success: colorRes => {
                  console.log('颜色生成成功：', colorRes);

                  const colorResult = colorRes.result as {
                    success: boolean;
                    selectedColor: {
                      background: string;
                      text: string;
                      color_name: string;
                      color_name_en: string;
                    };
                  };

                  if (colorResult && colorResult.success && colorResult.selectedColor) {
                    // 获取颜色编码 - 使用 selectedColor 对象
                    cardData.backgroundColor = encodeURIComponent(colorResult.selectedColor.background);
                    cardData.textColor = encodeURIComponent(colorResult.selectedColor.text);

                    // 跳转到结果页并传递所有参数
                    self.navigateToCardResult(cardData);
                  } else {
                    // 颜色生成失败，使用默认颜色跳转
                    console.error('颜色生成失败，使用默认颜色跳转:', colorRes.result);
                    self.navigateToCardResult(cardData);
                  }
                },
                fail: colorErr => {
                  console.error('颜色云函数调用失败：', colorErr);
                  // 颜色生成失败，使用默认颜色跳转
                  self.navigateToCardResult(cardData);
                }
              });
            } else {
              // 文本生成失败，使用默认文本跳转
              console.error('文本生成失败，使用默认文本跳转:', result);
              cardData.quote = encodeURIComponent('愿你如这色彩般美好。');
              self.navigateToCardResult(cardData);
            }
          },
          fail: err => {
            console.error('文本云函数调用失败：', err);
            // 云函数调用失败，使用默认文本直接跳转
            cardData.quote = encodeURIComponent('愿你如这色彩般美好。');

            wx.showToast({
              title: '正在生成卡片...',
              icon: 'loading',
              duration: 1000
            });

            // 延迟1秒后跳转，给用户更好的体验
            setTimeout(() => {
              self.navigateToCardResult(cardData);
            }, 1000);
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
    navigateToCardResult(cardData: any) {
      const self = this as any;

      // 构建跳转 URL
      let url = `/pages/card-result/index?color=${cardData.color}&type=color`;

      // 如果有AI生成的引用文本，添加到URL
      if (cardData.quote) {
        url += `&quote=${cardData.quote}`;
      }

      // 如果有颜色编码，添加到URL
      if (cardData.backgroundColor && cardData.textColor) {
        url += `&backgroundColor=${cardData.backgroundColor}&textColor=${cardData.textColor}`;
      }

      // 添加云函数调用参数，用于"再读一则"功能
      const selectedColor = self.data.colors[self.data.selectedColor];
      const chatgptParams = encodeURIComponent(JSON.stringify({
        name: 'sendMessage',
        message: `你是一位专业心灵导师，擅长用一句话触发职场人的内在共鸣。  基于用户分享的心情 ${selectedColor.name}，请生成一句中英文对照的“彩虹卡”式疗愈语句，要求：  
        1. 只输出一句完整话语，先中文后英文；  
        2. 不超过20字（中文）+ 20字（英文）；  
        3. 富有温度与安全感，无需前置主题词；  
        4. 留有“空白”感，让用户自行投射与解读；  
        5. 适合职场场景，能引发内心共鸣。`,
        model: 'deepseek-v3',
        temperature: 0.7,
        max_tokens: 150
      }));

      const colorpsychologyParams = encodeURIComponent(JSON.stringify({
        text: `用户选择了颜色：${selectedColor.name}，含义：${selectedColor.meaning}`
      }));

      url += `&chatgptParams=${chatgptParams}&colorpsychologyParams=${colorpsychologyParams}`;

      // 执行跳转
      wx.navigateTo({
        url: url,
        success: () => {
          console.log('成功跳转到卡片结果页');
        },
        complete: () => {
          // 重置加载状态
          self.setData({
            isLoading: false,
            loadingText: ''
          });
        }
      });
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
