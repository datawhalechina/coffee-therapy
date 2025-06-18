// index.ts
// 选择捕捉方式页面

Component({
  data: {
    // 页面数据
    timerInterval: null as any,
    isLoading: false,
    loadingText: ''
  },
  methods: {
    // 导航到其他页面
    navigateTo(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.navigateTo({
        url: url,
      });
    },
    
    // 直接生成疗愈卡片
    generateDirectCard() {
      const self = this as any;
      if (self.data.isLoading) {
        return;
      }
      
      self.setData({
        isLoading: true,
        loadingText: '正在为您生成专属疗愈卡片...'
      });
      
      const cardData: any = {};
      
      // 第一步：调用 chatgpt 云函数生成随机疗愈文字
      wx.cloud.callFunction({
        name: 'chatgpt',
        data: {
          name: 'sendMessage',
          message: '生成30字以内温暖疗愈文字。',
          sessionId: 'direct_' + Date.now(),
          model: 'deepseek-v3',
          temperature: 0.8,
          max_tokens: 150
        },
        success: res => {
          console.log('随机文本生成成功：', res);
          
          const result = res.result as any;
          
          if (result && result.success) {
            // 获取AI生成的回复
            const aiReply = result.reply;
            cardData.quote = encodeURIComponent(aiReply);
            
            // 第二步：调用 colorsupport 云函数生成随机颜色
            wx.cloud.callFunction({
              name: 'colorsupport',
              data: {
                name: 'generateColor',
                randomMode: true,
                context: '随机疗愈卡片'
              },
              success: colorRes => {
                console.log('随机颜色生成成功：', colorRes);
                
                const colorResult = colorRes.result as any;
                
                if (colorResult && colorResult.success && colorResult.data) {
                  // 获取颜色编码 - 修正字段名称
                  cardData.backgroundColor = encodeURIComponent(colorResult.data.background);
                  cardData.textColor = encodeURIComponent(colorResult.data.text);
                }
                
                // 跳转到结果页并传递所有参数
                self.navigateToCardResult(cardData);
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
            cardData.quote = encodeURIComponent('愿你拥有内心的平静与美好。');
            self.navigateToCardResult(cardData);
          }
        },
        fail: err => {
          console.error('文本云函数调用失败：', err);
          // 云函数调用失败，使用默认文本直接跳转
          cardData.quote = encodeURIComponent('愿你拥有内心的平静与美好。');
          
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
    },
    
    // 跳转到卡片结果页
    navigateToCardResult(cardData: any) {
      // 构建跳转 URL
      let url = '/pages/card-result/index?type=direct';
      
      // 如果有AI生成的引用文本，添加到URL
      if (cardData.quote) {
        url += `&quote=${cardData.quote}`;
      }
      
      // 如果有颜色编码，添加到URL
      if (cardData.backgroundColor && cardData.textColor) {
        url += `&backgroundColor=${cardData.backgroundColor}&textColor=${cardData.textColor}`;
      }
      
      // 添加云函数调用参数，用于"再读一则"功能
      const chatgptParams = encodeURIComponent(JSON.stringify({
        name: 'sendMessage',
        message: '生成30字以内温暖疗愈文字。',
        model: 'deepseek-v3',
        temperature: 0.8,
        max_tokens: 150
      }));
      
      const colorsupportParams = encodeURIComponent(JSON.stringify({
        name: 'generateColor',
        randomMode: true,
        context: '随机疗愈卡片'
      }));
      
      url += `&chatgptParams=${chatgptParams}&colorsupportParams=${colorsupportParams}`;
      
      const self = this as any;
      
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
    },
    
    // 调用云函数存储数据到数据库
    storeDataToCloud() {
      const self = this as any;
      // 防止重复调用
      if (self.data.isLoading) {
        return;
      }
      
      console.log('开始调用云函数 printHelloWorld');
      
      // 调用云函数
      wx.cloud.callFunction({
        name: 'printHelloWorld',
        data: {},
        success: (res) => {
          console.log('云函数调用成功:', res);
        },
        fail: (err) => {
          console.error('云函数调用失败:', err);
        },
        complete: () => {
          // 不再设置 isLoading 状态，因为这个函数和主要功能分离
        }
      });
    }
  },
  lifetimes: {
    attached() {
      // 页面加载时的逻辑
      console.log('Index page attached');
      
      const self = this as any;
      
      // 初始化云环境
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      } else {
        wx.cloud.init({
          env: 'cloud1-4gythsnw8615145d',
          traceUser: true,
        });
        
        // 立即执行一次，不用等待5秒
        self.storeDataToCloud();
      }
    },
    
    detached() {
      const self = this as any;
      // 页面卸载时清除定时器，防止内存泄漏
      if (self.data.timerInterval) {
        clearInterval(self.data.timerInterval);
        self.data.timerInterval = null;
      }
    }
  }
})
