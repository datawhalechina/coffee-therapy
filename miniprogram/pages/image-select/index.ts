// image-select/index.ts
import config from '../../config/env';

Component({
  data: {
    selectedImage: -1, // -1 表示未选择任何图片
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: config.cloudEnv, // 云环境ID
    images: [
      {
        title: '自然风光类',
        src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'nature',
        meaning: '当前存在压力，希望缓解工作压力'
      },
      {
        title: '温馨尝尽类',
        src: 'https://pic.ibaotu.com/23/08/31/aigc/1146495116022915182.png!ww7002',
        category: 'coffee',
        meaning: '有社交烦恼，改善社交焦虑'
      },
      {
        title: '抽象艺术类',
        src: 'https://n.sinaimg.cn/sinacn20111/43/w900h743/20190425/663e-hvvuiyn9518053.jpg',
        category: 'peaceful',
        meaning: '激发创造力，希望有所启发，坚守自我'
      },
      {
        title: '意向类',
        src: 'https://puui.qpic.cn/vpic_cover/x3106lj860k/x3106lj860k_hz.jpg/1280',
        category: 'lifestyle',
        meaning: '创伤后成长，希望能有所安抚'
      },
      {
        title: '海洋蓝调类',
        src: 'https://tse3-mm.cn.bing.net/th/id/OIP-C.JbRCpud1xMZ0234XTeEk1gHaHa?rs=1&pid=ImgDetMain&cb=idpwebp2&o=7&rm=3',
        category: 'nature',
        meaning: '希望提升专注力，得到鼓励'
      },
      {
        title: '音乐律动类',
        src: 'https://pic.ibaotu.com/23/05/15/translate/1107597315306442782.png!ww7002',
        category: 'lifestyle',
        meaning: '处理代际创伤，得到安抚快乐'
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
        loadingText: '正在生成您的专属卡片...'
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
          message: `你是一位擅长写意境诗句的心灵导师。基于用户选择的图片寓意：${selectedImage.meaning}，请创作一句富有画面感的话，要求：
1. 字数不超过30字
2. 以"让我们"、"原来"、"总有"等词开头
3. 将图片意境与人生感悟相结合
4. 表达优美，意境深远
5. 能引发职场人对生活的思考
6. 只输出这一句话，不要其他内容`,
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
            
            // 第二步：调用 colorpsychology 云函数生成颜色（简化参数）
            wx.cloud.callFunction({
              name: 'colorpsychology',
              data: {
                text: `${selectedImage.meaning}`
              },
              success: colorRes => {
                console.log('颜色生成成功：', colorRes);
                
                const colorResult = colorRes.result as any;
                
                if (colorResult && colorResult.success && colorResult.selectedColor) {
                  // 获取颜色编码 - 使用 selectedColor 对象
                  cardData.backgroundColor = encodeURIComponent(colorResult.selectedColor.background);
                  cardData.textColor = encodeURIComponent(colorResult.selectedColor.text);
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
        message: `你是一位擅长写意境诗句的心灵导师。基于用户选择的图片寓意：${selectedImage.title}，请创作一句富有画面感的话，要求：
1. 字数不超过30字
2. 以"让我们"、"原来"、"总有"等词开头
3. 将图片意境与人生感悟相结合
4. 表达优美，意境深远
5. 能引发职场人对生活的思考
6. 只输出这一句话，不要其他内容`,
        model: 'deepseek-v3',
        temperature: 0.7,
        max_tokens: 150
      }));
      
      const colorpsychologyParams = encodeURIComponent(JSON.stringify({
        text: `用户选择了图片：${selectedImage.title}，类别：${selectedImage.category}`
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
