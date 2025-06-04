// 获取toast实例
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    isFlipped: false,
    isImageLoading: false,
    imageTaskId: '',
    hasCustomImage: false,
    cloudEnvId: 'cloud1-4gythsnw8615145d', // 云环境ID
    cardData: {
      frontImage: '',
      title: '宁静时刻',
      subtitle: '让心灵沉浸在阅读的宁静时光中',
      quote: '当您沉浸在书中的世界，您的心灵正在获得最真实的休息。阅读不仅是知识的获取，更是心灵的疗愈。请记住，每一页翻动都是一次内心的对话，每一次思考都是自我成长的契机。'
    },
    recommendations: [
      {
        id: 'coffee',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
        title: '咖啡时光',
        subtitle: '放慢脚步，享受当下'
      },
      {
        id: 'mountain',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
        title: '宁静山景',
        subtitle: '远离喧嚣，寻找平静'
      },
      {
        id: 'light',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1738&q=80',
        title: '温暖灯光',
        subtitle: '家的温馨与舒适'
      }
    ],
    // 卡片内容库，模仿原型中的示例内容
    cardContents: {
      "blue": {
        frontImage: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1626&q=80",
        title: "平静海洋",
        subtitle: "让心灵如海洋般宽广平静",
        quote: "平静如海的心境，是内心强大的体现。当您面对生活的波涛时，请记住：您的内心可以如同深海一般，表面有波澜，深处却始终平静。"
      },
      "red": {
        frontImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1738&q=80",
        title: "热情能量",
        subtitle: "点燃内心的热情与动力",
        quote: "热情是推动我们前行的燃料。当您感到疲惫时，请回想那些让您心跳加速的时刻，让内心的火焰重新燃起，照亮前行的道路。"
      },
      "green": {
        frontImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
        title: "自然和谐",
        subtitle: "在自然中找回内心的平衡",
        quote: "大自然是最好的治愈师。当您感到迷失或不平衡时，请回归自然，聆听树叶的沙沙声，感受阳光的温暖，让心灵在大自然的怀抱中重获平衡与和谐。"
      }
    }
  },
  
  onLoad: function(options) {
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
    
    console.log('卡片结果页接收到的参数：', options);
    
    // 获取路由参数
    const { side = '', color = '', image = '', text = '', quote = '', imageTaskId = '' } = options;
    
    // 先默认显示卡片的正面
    let shouldFlip = false;
    
    // 如果指定了显示文本面，或者有AI生成的引用文本，则显示背面
    if (side === 'text' || quote) {
      shouldFlip = true;
    }
    
    // 处理卡片内容
    let updatedCardData = { ...this.data.cardData }; // 初始化为当前卡片数据
    
    // 1. 处理颜色参数，更新整个卡片模板
    if (color && this.data.cardContents[color]) {
      updatedCardData = { ...this.data.cardContents[color] };
    }
    
    // 2. 处理来自文本输入页的参数
    if (text) {
      // 如果有用户输入的文本，可以保存或显示
      updatedCardData.userInput = decodeURIComponent(text);
    }
    
    // 3. 处理AI生成的引用文本
    if (quote) {
      const decodedQuote = decodeURIComponent(quote);
      updatedCardData.quote = decodedQuote;
      // 确保卡片翻转显示文本面
      shouldFlip = true;
    }
    // 如果没有quote但有image，根据图片设置引用文本
    else if (image) {
      if (image === '宁静山景') {
        updatedCardData.quote = '山的宁静给予我们内心的力量。在喧嚣的世界中，请记得为自己留一片宁静的空间，就像高山之巅的那片蓝天，让思绪自由翱翔。';
      } else if (image === '咖啡时光') {
        updatedCardData.quote = '一杯咖啡，一段时光。当您品味咖啡的醇香时，也是在品味生活的细节。请放慢脚步，享受这短暂的时光，让心灵在香气中得到片刻的宁静。';
      }
    }
    
    // 4. 如果有图片任务ID，尝试获取图片
    if (imageTaskId) {
      this.setData({
        isImageLoading: true,
        imageTaskId: imageTaskId
      });
      
      // 调用云函数获取图片
      this.getImageByTaskId(imageTaskId);
    }
    
    // 更新卡片数据和翻转状态
    this.setData({
      cardData: updatedCardData,
      isFlipped: shouldFlip
    });
    
    // 显示卡片生成完成的提示
    if (quote) {
      wx.showToast({
        title: '疗愈卡片已生成',
        icon: 'success',
        duration: 1500
      });
    }
  },
  
  // 根据任务ID获取图片
  getImageByTaskId: function(taskId) {
    // 调用云函数获取图片
    wx.cloud.callFunction({
      name: 'newpic',
      data: {
        name: 'getImageById',
        taskId: taskId
      },
      success: res => {
        console.log('获取图片成功：', res);
        
        if (res.result && res.result.success) {
          // 如果图片任务成功完成
          if (res.result.imageUrl) {
            // 更新卡片背景图片
            this.setData({
              'cardData.frontImage': res.result.imageUrl,
              isImageLoading: false,
              hasCustomImage: true
            });
          } else if (res.result.status === 'RUNNING') {
            // 图片任务还在运行，设置定时器再次检查
            console.log('图片任务还在运行，5秒后重试');
            setTimeout(() => {
              this.getImageByTaskId(taskId);
            }, 5000); // 5秒后重试
          } else {
            // 任务完成但没有图片URL
            console.log('图片任务状态异常：', res.result);
            this.setData({
              isImageLoading: false
            });
          }
        } else {
          // 获取图片失败
          console.error('获取图片失败：', res.result);
          this.setData({
            isImageLoading: false
          });
        }
      },
      fail: err => {
        console.error('调用获取图片云函数失败：', err);
        this.setData({
          isImageLoading: false
        });
      }
    });
  },
  
  // 卡片翻转处理
  flipCard: function() {
    this.setData({
      isFlipped: !this.data.isFlipped
    });
  },
  
  // 分享功能
  handleShare: function() {
    // 微信小程序的分享逻辑
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '分享功能已开启',
      theme: 'success',
      direction: 'column'
    });
  },
  
  // 保存功能
  handleSave: function() {
    wx.showLoading({
      title: '保存中...',
    });
    
    // 在真实场景中，这里可能涉及到保存图片到本地或者保存到收藏列表的逻辑
    setTimeout(() => {
      wx.hideLoading();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '保存成功',
        theme: 'success',
        direction: 'column'
      });
    }, 1500);
  },
  
  // 再来一张功能
  handleRefresh: function() {
    wx.showLoading({
      title: '生成中...',
    });
    
    // 模拟随机获取一张新卡片
    const colors = ['blue', 'red', 'green'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setTimeout(() => {
      this.setData({
        cardData: this.data.cardContents[randomColor],
        isFlipped: false
      });
      wx.hideLoading();
    }, 1500);
  },
  
  // 处理推荐卡片点击
  handleRecommendation: function(e) {
    const id = e.currentTarget.dataset.id;
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: `您选择了：${id}`,
      theme: 'success',
      direction: 'column'
    });
    
    // 实际应用中，这里可能会跳转到对应的卡片详情
    // wx.navigateTo({
    //   url: `/pages/card-detail/card-detail?id=${id}`
    // });
  },
  
  // 自定义分享内容
  onShareAppMessage: function() {
    return {
      title: `${this.data.cardData.title} - AI咖啡轻疗愈`,
      path: `/pages/card-result/index?color=blue`,
      imageUrl: this.data.cardData.frontImage
    };
  },
  
  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: `${this.data.cardData.title} - AI咖啡轻疗愈`,
      query: `color=blue`,
      imageUrl: this.data.cardData.frontImage
    };
  }
});
