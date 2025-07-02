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
    // 本地随机颜色生成函数
    generateRandomColor() {
      const colorPairs = [
        { background: 'rgba(203, 203, 231, 1)', text: 'rgba(89, 88, 128, 1)' },
        { background: 'rgba(172, 189, 111, 1)', text: 'rgba(253, 242, 218, 1)' },
        { background: 'rgba(252, 226, 169, 1)', text: 'rgba(241, 111, 51, 1)' },
        { background: 'rgba(252, 226, 169, 1)', text: 'rgba(241, 111, 51, 1)' },
        { background: 'rgba(203, 203, 231, 1)', text: 'rgba(89, 88, 128, 1)' },
        { background: 'rgba(201, 228, 255, 1)', text: 'rgba(50, 79, 109, 1)' },
        { background: 'rgba(148, 173, 255, 1)', text: 'rgba(233, 242, 255, 1)' },
        { background: 'rgba(253, 207, 191, 1)', text: 'rgba(84, 104, 182, 1)' },
        { background: 'rgba(231, 119, 147, 1)', text: 'rgba(253, 242, 218, 1)' },
        { background: 'rgba(178, 131, 66, 1)', text: 'rgba(255, 241, 209, 1)' },
        { background: 'rgba(200, 217, 128, 1)', text: 'rgba(114, 129, 54, 1)' },
        { background: 'rgba(255, 188, 249, 1)', text: 'rgba(171, 95, 174, 1)' },
        { background: 'rgba(244, 205, 176, 1)', text: 'rgba(208, 113, 97, 1)' },
        { background: 'rgba(38, 93, 113, 1)', text: 'rgba(205, 237, 246, 1)' }
      ];
      
      const randomIndex = Math.floor(Math.random() * colorPairs.length);
      return colorPairs[randomIndex];
    },

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
          message: `请生成一句"今日心理能量提示语"。
要求如下：
- 不使用自然意象（如光、水、风、树、花、星星等）；
- 内容围绕"平静、接纳、觉察、放下、信任、成长、连接"等心理主题；
- 语言风格简洁、诗意、哲理、留白，有温柔引导感，避免命令句；
- 一次只输出一句完整句子；
- 格式为：中文在前，英文在后；
- 中文不超过20个字，英文不超过20个单词；
- 不要添加引号、标点或其他说明性文字；`,
          sessionId: 'direct_' + Date.now(),
          model: 'deepseek-v3',
          temperature: 1.0,
          max_tokens: 150
        },
        success: res => {
          console.log('随机文本生成成功：', res);
          
          const result = res.result as any;
          
          if (result && result.success) {
            // 获取AI生成的回复
            const aiReply = result.reply;
            cardData.quote = encodeURIComponent(aiReply);
            
            // 第二步：使用本地随机颜色生成函数
            const selectedColor = self.generateRandomColor();
            console.log('随机颜色生成成功：', selectedColor);
            
            // 获取颜色编码
            cardData.backgroundColor = encodeURIComponent(selectedColor.background);
            cardData.textColor = encodeURIComponent(selectedColor.text);
            
            // 延迟一下再跳转
            setTimeout(() => {
              // 跳转到结果页并传递所有参数
              self.navigateToCardResult(cardData);
            }, 800);
          } else {
            // 文本生成失败，使用默认文本和随机颜色跳转
            console.error('文本生成失败，使用默认文本跳转:', result);
            cardData.quote = encodeURIComponent('愿你拥有内心的平静与美好。');
            
            // 使用本地随机颜色生成函数
            const selectedColor = self.generateRandomColor();
            cardData.backgroundColor = encodeURIComponent(selectedColor.background);
            cardData.textColor = encodeURIComponent(selectedColor.text);
            
            setTimeout(() => {
              self.navigateToCardResult(cardData);
            }, 800);
          }
        },
        fail: err => {
          console.error('文本云函数调用失败：', err);
          // 云函数调用失败，使用默认文本和随机颜色直接跳转
          cardData.quote = encodeURIComponent('愿你拥有内心的平静与美好。');
          
          // 使用本地随机颜色生成函数
          const selectedColor = self.generateRandomColor();
          cardData.backgroundColor = encodeURIComponent(selectedColor.background);
          cardData.textColor = encodeURIComponent(selectedColor.text);
          
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
        message: `请生成一句"今日心理能量提示语"。
要求如下：
- 不使用自然意象（如光、水、风、树、花、星星等）；
- 内容围绕"平静、接纳、觉察、放下、信任、成长、连接"等心理主题；
- 语言风格简洁、诗意、哲理、留白，有温柔引导感，避免命令句；
- 一次只输出一句完整句子；
- 格式为：中文在前，英文在后；
- 中文不超过20个字，英文不超过20个单词；
- 不要添加引号、标点或其他说明性文字；`,
        sessionId: 'direct_' + Date.now(),
        model: 'deepseek-v3',
        temperature: 1.0,
        max_tokens: 150
      }));
      
      // 使用本地随机颜色生成，不再需要colorpsychology参数
      const colorpsychologyParams = encodeURIComponent(JSON.stringify({
        useLocalRandomColor: true
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