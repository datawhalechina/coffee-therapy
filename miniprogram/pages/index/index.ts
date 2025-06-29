// index.ts
// 选择捕捉方式页面
import config from '../../config/env';

Component({
  data: {
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: config.cloudEnv, // 云环境ID
    showLoadingTransition: false // 控制过渡动画显示
  },
  onShow: function() {
    // 如果需要在页面显示时再次调用，可以保留这里
    // this.generateDirectCard();
  },
  methods: {
    // 导航到其他页面
    navigateTo(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.navigateTo({
        url: url,
      });
    },
    
    // 显示过渡动画
    showTransition() {
      (this as any).setData({
        showLoadingTransition: true
      });
    },
    
    // 隐藏过渡动画
    hideTransition() {
      (this as any).setData({
        showLoadingTransition: false
      });
    },
    
    // 直接生成疗愈卡片
    generateDirectCard() {
      const self = this as any;
      console.log('开始生成疗愈卡片');
      // 显示过渡动画
      self.showTransition();
      
      self.setData({
        isLoading: true,
        loadingText: '正在生成您的专属卡片...'
      });
      
      const cardData: any = {};
      
      // 第一步：调用 chatgpt 云函数生成随机文字
      wx.cloud.callFunction({
        name: 'chatgpt',
        data: {
          name: 'sendMessage',
          message: `你是一位专业心灵导师，擅长用一句话触发职场人的内在共鸣。基于用户分享的心情：开心愉悦快乐，希望得到鼓励，请生成一句中英文对照的"彩虹卡"式疗愈语句，要求：
1. 只输出一句完整话语，先中文后英文；
2. 不超过20字（中文）+ 20字（英文）；
3. 富有温度与安全感，无需前置主题词；
4. 留有"空白"感，让用户自行投射与解读；
5. 适合职场场景，能引发内心共鸣。`,
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
            
            // 第二步：调用 colorpsychology 云函数生成随机颜色
            wx.cloud.callFunction({
              name: 'colorpsychology',
              data: {
                text: '生成温暖疗愈的随机颜色'
              },
              success: colorRes => {
                console.log('随机颜色生成成功：', colorRes);
                
                const colorResult = colorRes.result as any;
                
                if (colorResult && colorResult.success && colorResult.selectedColor) {
                  // 获取颜色编码 - 使用 selectedColor 对象
                  cardData.backgroundColor = encodeURIComponent(colorResult.selectedColor.background);
                  cardData.textColor = encodeURIComponent(colorResult.selectedColor.text);
                }
                
                // 延迟一下再跳转
                setTimeout(() => {
                  // 跳转到结果页并传递所有参数
                  self.navigateToCardResult(cardData);
                }, 800);
              },
              fail: colorErr => {
                console.error('颜色云函数调用失败：', colorErr);
                // 颜色生成失败，使用默认颜色跳转
                setTimeout(() => {
                  self.navigateToCardResult(cardData);
                }, 800);
              }
            });
          } else {
            // 文本生成失败，使用默认文本跳转
            console.error('文本生成失败，使用默认文本跳转:', result);
            cardData.quote = encodeURIComponent('愿你拥有内心的平静与美好。');
            setTimeout(() => {
              self.navigateToCardResult(cardData);
            }, 800);
          }
        },
        fail: err => {
          console.error('文本云函数调用失败：', err);
          // 云函数调用失败，使用默认文本直接跳转
          cardData.quote = encodeURIComponent('愿你拥有内心的平静与美好。');
          
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
        message: `你是一位专业心灵导师，擅长用一句话触发职场人的内在共鸣。基于用户分享的心情：开心愉悦快乐，希望得到鼓励，请生成一句中英文对照的"彩虹卡"式疗愈语句，要求：
1. 只输出一句完整话语，先中文后英文；
2. 不超过20字（中文）+ 20字（英文）；
3. 富有温度与安全感，无需前置主题词；
4. 留有"空白"感，让用户自行投射与解读；
5. 适合职场场景，能引发内心共鸣。`,
        model: 'deepseek-v3',
        temperature: 0.8,
        max_tokens: 150
      }));
      
      const colorpsychologyParams = encodeURIComponent(JSON.stringify({
        text: '生成温暖疗愈的随机颜色'
      }));
      
      url += `&chatgptParams=${chatgptParams}&colorpsychologyParams=${colorpsychologyParams}`;
      
      const self = this as any;
      
      // 等待GIF动画播放完成后再跳转
      setTimeout(() => {
        // 执行跳转
        wx.redirectTo({
          url: url,
          success: () => {
            console.log('成功跳转到卡片结果页');
            // 跳转成功后隐藏过渡动画
            self.hideTransition();
          },
          complete: () => {
            // 重置加载状态
            self.setData({
              isLoading: false,
              loadingText: ''
            });
          }
        });
      }, 3000); // 等待3秒GIF动画播放完成
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
          env: self.data.cloudEnvId,
          traceUser: true,
        });
        console.log('云环境初始化成功！');
        
        // 立即执行一次，不用等待5秒
        self.storeDataToCloud();
        
        // 在页面加载时调用 generateDirectCard 函数
        self.generateDirectCard();
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
});