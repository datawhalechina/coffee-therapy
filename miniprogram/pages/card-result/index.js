// 获取toast实例
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    cloudEnvId: 'cloud1-4gythsnw8615145d', // 云环境ID
    cardData: {
      quote: '当您沉浸在书中的世界，您的心灵正在获得最真实的休息。阅读不仅是知识的获取，更是心灵的疗愈。请记住，每一页翻动都是一次内心的对话，每一次思考都是自我成长的契机。',
      backgroundColor: '#CBCBE7', // 默认背景颜色
      textColor: '#595880' // 默认文字颜色
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
    cardContents: {
      "blue": {
        quote: "平静如海的心境，是内心强大的体现。当您面对生活的波涛时，请记住：您的内心可以如同深海一般，表面有波澜，深处却始终平静。",
        backgroundColor: "#CBCBE7", // 蓝紫色卡片背景
        textColor: "#595880" // 蓝紫色文字颜色
      },
      "red": {
        quote: "热情是推动我们前行的燃料。当您感到疲惫时，请回想那些让您心跳加速的时刻，让内心的火焰重新燃起，照亮前行的道路。",
        backgroundColor: "#E7CBCB", // 红色卡片背景
        textColor: "#805959" // 红色文字颜色
      },
      "green": {
        quote: "大自然是最好的治愈师。当您感到迷失或不平衡时，请回归自然，聆听树叶的沙沙声，感受阳光的温暖，让心灵在大自然的怀抱中重获平衡与和谐。",
        backgroundColor: "#CBE7CB", // 绿色卡片背景
        textColor: "#598059" // 绿色文字颜色
      },
      "default": {
        backgroundColor: "#CBCBE7", // 默认蓝紫色卡片背景
        textColor: "#595880" // 默认蓝紫色文字颜色
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
    
    const { color = '', text = '', quote = '' } = options;
    
    let updatedCardData = { ...this.data.cardData };
    
    // 1. 处理颜色参数，更新卡片引用文本和样式
    if (color && this.data.cardContents[color]) {
      // 更新引用文本
      if (this.data.cardContents[color].quote) {
        updatedCardData.quote = this.data.cardContents[color].quote;
      }
      
      // 更新卡片背景颜色和文字颜色
      updatedCardData.backgroundColor = this.data.cardContents[color].backgroundColor;
      updatedCardData.textColor = this.data.cardContents[color].textColor;
    } else {
      // 使用默认颜色
      updatedCardData.backgroundColor = this.data.cardContents.default.backgroundColor;
      updatedCardData.textColor = this.data.cardContents.default.textColor;
    }
    
    // 2. 处理来自文本输入页的参数
    if (text) {
      updatedCardData.userInput = decodeURIComponent(text);
    }
    
    // 3. 处理AI生成的引用文本
    if (quote) {
      const decodedQuote = decodeURIComponent(quote);
      updatedCardData.quote = decodedQuote;
    }
    
    // 更新卡片数据
    this.setData({
      cardData: updatedCardData
    });
    
    // 显示卡片生成完成的提示
    if (quote || (color && this.data.cardContents[color])) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '疗愈卡片已生成',
        theme: 'success',
        duration: 1500
      });
    }
  },
  
  handleShare: function() {
    console.log('Share button tapped');
    Toast({
      context: this,
      selector: '#t-toast',
      message: '分享功能待实现',
      icon: 'help-circle'
    });
  },
  
  handleReadAnother: function() {
    console.log('Read Another button tapped');
    const quotes = [
      "生活就像一杯咖啡，苦涩中带着香醇。",
      "每一次日出都是一个新的开始，充满希望。",
      "保持微笑，世界也会对你微笑。",
      "勇敢地追求自己的梦想，不要害怕失败。"
    ];
    
    // 同时随机选择一个颜色主题
    const colorThemes = ['blue', 'red', 'green'];
    const randomColorIndex = Math.floor(Math.random() * colorThemes.length);
    const randomColor = colorThemes[randomColorIndex];
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selectedTheme = this.data.cardContents[randomColor];
    
    this.setData({
      'cardData.quote': quotes[randomIndex],
      'cardData.backgroundColor': selectedTheme.backgroundColor,
      'cardData.textColor': selectedTheme.textColor
    });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '已更新疗愈内容',
      theme: 'success',
      duration: 1000
    });
  }
});
