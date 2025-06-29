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
    cloudEnvId: config.cloudEnv // 云环境ID
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

    // 生成卡片
    generateCard: function () {
      const text = this.data.inputText;
      if (!text) return;

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
message: `你是一位专业心灵导师，擅长用一句话触发职场人的内在共鸣。  基于用户分享的心情 ${text}，请生成一句中英文对照的“彩虹卡”式疗愈语句，要求：  
        1. 只输出一句完整话语，先中文后英文；  
        2. 不超过20字（中文）+ 20字（英文）；  
        3. 富有温度与安全感，无需前置主题词；  
        4. 留有“空白”感，让用户自行投射与解读；  
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

            // 第二步：调用 colorpsychology 云函数生成颜色
            wx.cloud.callFunction({
              name: 'colorpsychology',
              data: {
                name: 'analyzeColor',
                text: text
              },
              success: colorRes => {
                console.log('颜色生成成功：', colorRes);

                const colorResult = colorRes.result;

                if (colorResult && colorResult.success && colorResult.selectedColor) {
                  // 获取颜色编码 - 使用 selectedColor 对象
                  cardData.backgroundColor = encodeURIComponent(colorResult.selectedColor.background);
                  cardData.textColor = encodeURIComponent(colorResult.selectedColor.text);
                }

                // 跳转到结果页并传递所有参数
                this.navigateToCardResult(cardData);
              },
              fail: colorErr => {
                console.error('颜色云函数调用失败：', colorErr);
                // 颜色生成失败，使用默认颜色跳转
                this.navigateToCardResult(cardData);
              }
            });
          } else {
            // 文本生成失败，使用默认文本跳转
            console.error('文本生成失败，使用默认文本跳转:', result);
            cardData.quote = encodeURIComponent('愿你内心平静，拥抱美好。');
            this.navigateToCardResult(cardData);
          }
        },
        fail: err => {
          console.error('文本云函数调用失败：', err);
          // 云函数调用失败，使用默认文本直接跳转
          cardData.quote = encodeURIComponent('愿你内心平静，拥抱美好。');

          wx.showToast({
            title: '正在生成卡片...',
            icon: 'loading',
            duration: 1000
          });

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
        message: `你是一位擅长写意境诗句的心灵导师。基于用户分享的心情：${userText}，请创作一句回应的话，要求：
1. 字数不超过30字
2. 以"记住"、"原来"、"其实"、"从此"等词开头
3. 表达对用户心情的理解和启发
4. 意境优美，给人深刻的思考和感悟
5. 能引发职场人的内心共鸣
6. 只输出这一句话，不要其他内容`,
        model: 'deepseek-v3',
        temperature: 0.7,
        max_tokens: 200
      }));

      const colorpsychologyParams = encodeURIComponent(JSON.stringify({
        name: 'analyzeColor',
        text: userText
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
          this.setData({
            isLoading: false,
            loadingText: ''
          });
        }
      });
    }
  }
});
