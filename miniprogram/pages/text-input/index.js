// text-input/index.js
import config from '../../config/env';

Component({
  data: {
    // 页面数据
    inputText: '',
    textCount: 0,
    exampleTexts: ['工作压力很大', '感到焦虑不安', '需要放松心情', '寻找生活方向'],
    selectedExample: -1, // -1 表示未选择任何示例
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: config.cloudEnv, // 云环境ID
    showLoadingTransition: false, // 控制过渡动画显示
  },

  lifetimes: {
    // 在组件实例被创建时执行
    attached: function () {
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
    // 本地随机颜色生成函数
    generateRandomColor: function() {
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

    // 文本输入变化事件
    onTextChange: function (e) {
      const text = e.detail.value || '';
      this.setData({
        inputText: text,
        textCount: text.length
      });
    },

    // 选择示例文本
    selectExample: function (e) {
      const index = e.currentTarget.dataset.index;
      const text = this.data.exampleTexts[index];

      this.setData({
        selectedExample: index,
        inputText: text,
        textCount: text.length
      });
    },

    // 显示过渡动画
    showTransition() {
      this.setData({
        showLoadingTransition: true
      });
    },

    // 隐藏过渡动画
    hideTransition() {
      this.setData({
        showLoadingTransition: false
      });
    },

    // 生成卡片
    generateCard: function() {
      const text = this.data.inputText.trim();
      
      if (!text) {
        wx.showToast({
          title: '请输入内容',
          icon: 'none'
        });
        return;
      }

      // 显示过渡动画
      this.showTransition();

      this.setData({
        isLoading: true,
        loadingText: '正在生成您的专属卡片...'
      });

      const cardData = {
        text: encodeURIComponent(text)
      };

      // 第一步：调用 chatgpt 云函数生成疗愈文字
      wx.cloud.callFunction({
        name: 'chatgpt',
        data: {
          name: 'sendMessage',
          message: `你是一位专业心灵导师，擅长用一句话触发职场人的内在共鸣。基于用户分享的心情：${text}，请生成一句中英文对照的"彩虹卡"式疗愈语句，要求：
1. 只输出一句完整话语，先中文后英文；
2. 不超过20字（中文）+ 20字（英文）；
3. 富有温度与安全感，无需前置主题词；
4. 留有"空白"感，让用户自行投射与解读；
5. 适合职场场景，能引发内心共鸣。`,
          sessionId: 'text_' + Date.now(),
          model: 'deepseek-v3',
          temperature: 0.7,
          max_tokens: 200
        },
        success: res => {
          console.log('文本生成成功：', res);

          const result = res.result;

          if (result && result.success) {
            // 获取AI生成的回复
            const aiReply = result.reply;
            cardData.quote = encodeURIComponent(aiReply);

            // 第二步：使用本地随机颜色生成函数
            const selectedColor = this.generateRandomColor();
            console.log('随机颜色生成成功：', selectedColor);
            
            // 获取颜色编码
            cardData.backgroundColor = encodeURIComponent(selectedColor.background);
            cardData.textColor = encodeURIComponent(selectedColor.text);

            // 延迟一下再跳转
            setTimeout(() => {
              // 跳转到结果页并传递所有参数
              this.navigateToCardResult(cardData);
            }, 800);
          } else {
            // 文本生成失败，使用默认文本和随机颜色跳转
            console.error('文本生成失败，使用默认文本跳转:', result);
            cardData.quote = encodeURIComponent('愿你内心平静，拥抱美好。');
            
            // 使用本地随机颜色生成函数
            const selectedColor = this.generateRandomColor();
            cardData.backgroundColor = encodeURIComponent(selectedColor.background);
            cardData.textColor = encodeURIComponent(selectedColor.text);
            
            setTimeout(() => {
              this.navigateToCardResult(cardData);
            }, 800);
          }
        },
        fail: err => {
          console.error('文本云函数调用失败：', err);
          // 云函数调用失败，使用默认文本和随机颜色直接跳转
          cardData.quote = encodeURIComponent('愿你内心平静，拥抱美好。');

          // 使用本地随机颜色生成函数
          const selectedColor = this.generateRandomColor();
          cardData.backgroundColor = encodeURIComponent(selectedColor.background);
          cardData.textColor = encodeURIComponent(selectedColor.text);

          // 延迟1秒后跳转，给用户更好的体验
          setTimeout(() => {
            this.navigateToCardResult(cardData);
          }, 1000);
        }
      });
    },

    // 跳转到卡片结果页
    navigateToCardResult: function (cardData) {
      // 构建跳转 URL
      let url = `/pages/card-result/index?text=${cardData.text}&type=text`;

      // 如果有AI生成的引用文本，添加到URL
      if (cardData.quote) {
        url += `&quote=${cardData.quote}`;
      }

      // 如果有颜色编码，添加到URL
      if (cardData.backgroundColor && cardData.textColor) {
        url += `&backgroundColor=${cardData.backgroundColor}&textColor=${cardData.textColor}`;
      }

      // 添加云函数调用参数，用于"再读一则"功能
      const userText = decodeURIComponent(cardData.text);
      const chatgptParams = encodeURIComponent(JSON.stringify({
        name: 'sendMessage',
        message: `你是一位专业心灵导师，擅长用一句话触发职场人的内在共鸣。基于用户分享的心情：${userText}，请生成一句中英文对照的"彩虹卡"式疗愈语句，要求：
1. 只输出一句完整话语，先中文后英文；
2. 不超过20字（中文）+ 20字（英文）；
3. 富有温度与安全感，无需前置主题词；
4. 留有"空白"感，让用户自行投射与解读；
5. 适合职场场景，能引发内心共鸣。`,
        model: 'deepseek-v3',
        temperature: 0.7,
        max_tokens: 200
      }));

      const colorpsychologyParams = encodeURIComponent(JSON.stringify({
        useLocalRandomColor: true
      }));

      url += `&chatgptParams=${chatgptParams}&colorpsychologyParams=${colorpsychologyParams}`;

      // 等待GIF动画播放完成后再跳转
      setTimeout(() => {
        // 执行跳转
        wx.redirectTo({
          url: url,
          success: () => {
            console.log('成功跳转到卡片结果页');
            // 跳转成功后隐藏过渡动画
            this.hideTransition();
          },
          complete: () => {
            // 重置加载状态
            this.setData({
              isLoading: false,
              loadingText: ''
            });
          }
        });
      }, 3000); // 等待3秒GIF动画播放完成
    },
  }
});
