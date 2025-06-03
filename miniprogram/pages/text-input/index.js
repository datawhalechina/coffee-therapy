// text-input/index.js

Component({
  data: {
    // 页面数据
    inputText: '',
    textCount: 0,
    exampleTexts: ['工作压力很大', '感到焦虑不安', '需要放松心情', '寻找生活方向'],
    selectedExample: -1, // -1 表示未选择任何示例
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: 'cloud1-4gythsnw8615145d' // 云环境ID
  },
  
  lifetimes: {
    // 在组件实例被创建时执行
    attached: function() {
      // 初始化云环境
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      } else {
        wx.cloud.init({
          env: this.data.cloudEnvId,
          traceUser: true,
        });
        console.log('云环境初始化成功！');
      }
    }
  },
  
  methods: {
    // 文本输入变化事件
    onTextChange: function(e) {
      const text = e.detail.value || '';
      this.setData({
        inputText: text,
        textCount: text.length
      });
    },
    
    // 选择示例文本
    selectExample: function(e) {
      const index = e.currentTarget.dataset.index;
      const text = this.data.exampleTexts[index];
      
      this.setData({
        selectedExample: index,
        inputText: text,
        textCount: text.length
      });
    },
    
    // 生成卡片
    generateCard: function() {
      const text = this.data.inputText;
      if (!text) return;
      
      this.setData({
        isLoading: true,
        loadingText: '正在生成您的疗愈卡片...'
      });
      
      // 创建一个对象存储云函数返回的数据
      const cardData = {
        text: encodeURIComponent(text)
      };
      
      // 第一步：调用 chatgpt 云函数生成文本
      wx.cloud.callFunction({
        name: 'chatgpt',
        data: {
          name: 'sendMessage',
          message: text + '　30字以内', // 添加字数限制
          sessionId: 'test_card_generation_' + Date.now(), // 使用与测试一致的会话 ID 前缀
          model: 'deepseek-v3',
          temperature: 0.7,
          max_tokens: 300
        },
        success: res => {
          console.log('文本生成成功：', res);
          
          if (res.result && res.result.success) {
            // 获取AI生成的回复
            const aiReply = res.result.reply;
            cardData.quote = encodeURIComponent(aiReply);
            
            // 随机生成一个卡片颜色（blue, red, green）
            const colors = ['blue', 'red', 'green'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            cardData.color = randomColor;
            
            // 第二步：调用 newpic 云函数生成图片
            const imagePrompt = `生成一张符合“${text}”主题的温暖提升友善温馨的插画，风格简约现代，色调清新`; // 生成图片的提示词
            
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
                
                if (picRes.result && picRes.result.success) {
                  // 获取图片任务ID
                  const imageTaskId = picRes.result.taskId;
                  cardData.imageTaskId = imageTaskId;
                  
                  // 跳转到结果页并传递所有参数
                  this.navigateToCardResult(cardData);
                } else {
                  // 图片生成失败，但仍然使用文本跳转
                  console.error('图片生成失败，仅使用文本跳转:', picRes.result);
                  this.navigateToCardResult(cardData);
                }
              },
              fail: picErr => {
                console.error('图片云函数调用失败：', picErr);
                // 图片生成失败，但仍然使用文本跳转
                this.navigateToCardResult(cardData);
              }
            });
          } else {
            // 处理文本生成错误情况
            wx.showToast({
              title: '生成失败，请重试',
              icon: 'none',
              duration: 2000
            });
            this.setData({
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
          this.setData({
            isLoading: false,
            loadingText: ''
          });
        }
      });
    },
    
    // 跳转到卡片结果页
    navigateToCardResult: function(cardData) {
      // 构建跳转 URL
      let url = `/pages/card-result/index?text=${cardData.text}&quote=${cardData.quote}&color=${cardData.color}`;
      
      // 如果有图片任务ID，添加到URL
      if (cardData.imageTaskId) {
        url += `&imageTaskId=${cardData.imageTaskId}`;
      }
      
      // 执行跳转
      wx.navigateTo({
        url: url,
        success: () => {
          console.log('成功跳转到卡片结果页');
        },
        complete: () => {
          // 重置加载状态
          this.setData({
            isLoading: false,
            loadingText: ''
          });
        }
      });
    }
  }
});
