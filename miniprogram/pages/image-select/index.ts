// image-select/index.ts
Component({
  data: {
    selectedImage: -1, // -1 表示未选择任何图片
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: 'cloud1-4gythsnw8615145d', // 云环境ID
    images: [
      {
        title: '自然风光类',
        src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'nature',
        meaning: '宁静的自然风景能让人感到平静与放松，远离喧嚣，让心灵回归最纯净的状态。'
      },
      {
        title: '追寻场景类',
        src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'coffee',
        meaning: '咖啡时光代表着放慢脚步，享受当下的美好。品味生活的细节，让心灵获得片刻的宁静。'
      },
      {
        title: '抽象艺术类',
        src: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'peaceful',
        meaning: '阅读是一种心灵的旅行，能让思绪得到放松。在书中寻找智慧，在字里行间找到共鸣。'
      },
      {
        title: '跨晚家征类',
        src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1738&q=80',
        category: 'lifestyle',
        meaning: '温暖的灯光代表着希望和温馨的家庭氛围，在柔和的光线中，找到内心的安定与平静。'
      },
      {
        title: '海洋蓝调类',
        src: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1626&q=80',
        category: 'nature',
        meaning: '海洋的宽广让人感到自由与无限可能，面对大海，我们的烦恼显得渺小，心胸也随之开阔。'
      },
      {
        title: '音乐律动类',
        src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'lifestyle',
        meaning: '音乐是心灵的语言，能够抚慰疲惫的心灵，让情绪得到释放，找到内心的平衡。'
      }
    ]
  },
  
  methods: {
    // 选择图片
    selectImage(e: any) {
      const index = e.currentTarget.dataset.index;
      const self = this as any;
      self.setData({
        selectedImage: index
      });
    },
    
    // 生成卡片并跳转到结果页
    generateCard() {
      const self = this as any;
      if (self.data.selectedImage === -1) {
        wx.showToast({
          title: '请选择一张图片',
          icon: 'none'
        });
        return;
      }
      
      const selectedImage = self.data.images[self.data.selectedImage];
      
      self.setData({
        isLoading: true,
        loadingText: '正在生成您的疗愈卡片...'
      });
      
      const cardData: any = {
        image: encodeURIComponent(selectedImage.title),
        imageSrc: encodeURIComponent(selectedImage.src)
      };
      
      // 第一步：调用 chatgpt 云函数生成疗愈文字（简化消息内容）
      wx.cloud.callFunction({
        name: 'chatgpt',
        data: {
          name: 'sendMessage',
          message: `基于图片${selectedImage.title}，生成30字以内的疗愈文字。`,
          sessionId: 'img_' + Date.now(),
          model: 'deepseek-v3',
          temperature: 0.7,
          max_tokens: 150
        },
        success: res => {
          console.log('文本生成成功：', res);
          
          const result = res.result as any;
          
          if (result && result.success) {
            // 获取AI生成的回复
            const aiReply = result.reply;
            cardData.quote = encodeURIComponent(aiReply);
            
            // 第二步：调用 colorsupport 云函数生成颜色（简化参数）
            wx.cloud.callFunction({
              name: 'colorsupport',
              data: {
                name: 'generateColor',
                imageTitle: selectedImage.title,
                imageCategory: selectedImage.category
              },
              success: colorRes => {
                console.log('颜色生成成功：', colorRes);
                
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
                // 颜色生成失败，直接跳转，使用默认颜色
                self.navigateToCardResult(cardData);
              }
            });
          } else {
            // 文本生成失败，直接跳转，使用默认文本
            console.error('文本生成失败，使用默认文本跳转:', result);
            cardData.quote = encodeURIComponent('宁静致远，内心平和。');
            self.navigateToCardResult(cardData);
          }
        },
        fail: err => {
          console.error('文本云函数调用失败：', err);
          // 云函数调用失败，使用默认文本直接跳转
          cardData.quote = encodeURIComponent('宁静致远，内心平和。');
          
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
      const self = this as any;
      
      // 构建跳转 URL
      let url = `/pages/card-result/index?image=${cardData.image}&imageSrc=${cardData.imageSrc}&type=image`;
      
      // 如果有AI生成的引用文本，添加到URL
      if (cardData.quote) {
        url += `&quote=${cardData.quote}`;
      }
      
      // 如果有颜色编码，添加到URL
      if (cardData.backgroundColor && cardData.textColor) {
        url += `&backgroundColor=${cardData.backgroundColor}&textColor=${cardData.textColor}`;
      }
      
      // 添加云函数调用参数，用于"再读一则"功能
      const selectedImage = self.data.images[self.data.selectedImage];
      const chatgptParams = encodeURIComponent(JSON.stringify({
        name: 'sendMessage',
        message: `基于图片${selectedImage.title}，生成30字以内的疗愈文字。`,
        model: 'deepseek-v3',
        temperature: 0.7,
        max_tokens: 150
      }));
      
      const colorsupportParams = encodeURIComponent(JSON.stringify({
        name: 'generateColor',
        imageTitle: selectedImage.title,
        imageCategory: selectedImage.category
      }));
      
      url += `&chatgptParams=${chatgptParams}&colorsupportParams=${colorsupportParams}`;
      
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
    }
  }
});
