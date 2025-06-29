// 获取toast实例
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    cloudEnvId: 'cloud1-4gythsnw8615145d', // 云环境ID
    currentDate: {
      day: '',
      monthYear: ''
    },
    cardData: {
      quote: '当您沉浸在书中的世界，您的心灵正在获得最真实的休息。请记住，每一页翻动都是一次内心的对话，每一次思考都是自我成长的契机。',
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
  
  // 设置当前日期
  setCurrentDate: function() {
    const now = new Date();
    const day = now.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    this.setData({
      currentDate: {
        day: day.toString(),
        monthYear: `${month} ${year}`
      }
    });
  },
  
  onLoad: function(options) {
    // 设置当前日期
    this.setCurrentDate();
    
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
    
    // 保存云函数调用参数，用于"再读一则"功能
    if (options.chatgptParams) {
      this.chatgptParams = JSON.parse(decodeURIComponent(options.chatgptParams));
    }
    if (options.colorpsychologyParams) {
      this.colorpsychologyParams = JSON.parse(decodeURIComponent(options.colorpsychologyParams));
    }
    
    const { color = '', text = '', quote = '', backgroundColor = '', textColor = '', type = '' } = options;
    
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
    }
    
    // 2. 处理云函数返回的颜色编码（优先级更高）
    if (backgroundColor && textColor) {
      updatedCardData.backgroundColor = decodeURIComponent(backgroundColor);
      updatedCardData.textColor = decodeURIComponent(textColor);
    }
    
    // 3. 处理来自文本输入页的参数
    if (text) {
      updatedCardData.userInput = decodeURIComponent(text);
    }
    
    // 4. 处理AI生成的引用文本（优先级最高）
    if (quote) {
      const decodedQuote = decodeURIComponent(quote);
      updatedCardData.quote = decodedQuote;
    }
    
    // 更新卡片数据
    this.setData({
      cardData: updatedCardData
    });
    
    // 显示卡片生成完成的提示
    if (quote || backgroundColor || (color && this.data.cardContents[color])) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '专属卡片已生成',
        theme: 'success',
        duration: 1500
      });
    }
  },
  
  handleShare: function() {
    console.log('Share button tapped');
    
    // 直接调用生成分享图片，不再使用Promise方式
    this.generateShareImage();
  },

  // 绘制卡片内容 - 修复版本，参考测试成功的方法
  drawCard: function(ctx, width, height) {
    console.log('=== 开始绘制卡片（修复版本）===');
    console.log('画布尺寸:', width, 'x', height);
    
    const cardData = this.data.cardData;
    const currentDate = this.data.currentDate;
    
    console.log('卡片数据:', JSON.stringify(cardData));
    console.log('日期数据:', JSON.stringify(currentDate));
    
    try {
      // 重置变换矩阵，确保绘制从正确的坐标开始
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // 1. 绘制整体背景 - 使用浅灰色
      console.log('步骤1: 绘制整体背景');
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, width, height);
      console.log('整体背景绘制完成');
      
      // 2. 绘制顶部日期和标题区域
      console.log('步骤2: 绘制顶部区域');
      const headerHeight = 80;
      
      // 日期部分 - 使用绝对坐标
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px sans-serif'; // 稍微减小字体
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const dayText = currentDate.day || '27';
      ctx.fillText(dayText, 30, 20);
      console.log('日期绘制:', dayText, '位置: 30, 20');
      
      // 月年信息
      ctx.fillStyle = '#666666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const monthYearText = currentDate.monthYear || 'Jun 2025';
      ctx.fillText(monthYearText, 30, 50);
      console.log('月年绘制:', monthYearText, '位置: 30, 50');
      
      // 标题
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('宇宙漂流瓶', width / 2, 30);
      console.log('标题绘制完成，位置:', width / 2, 30);
      
      // 3. 绘制卡片主体
      console.log('步骤3: 绘制卡片主体');
      const cardMargin = 20;
      const cardX = cardMargin;
      const cardY = headerHeight + 10; // 90
      const cardWidth = width - (cardMargin * 2); // 335
      const cardHeight = 300; // 减小高度，确保在画布内
      
      console.log('卡片位置:', { cardX, cardY, cardWidth, cardHeight });
      console.log('卡片边界检查 - 右边界:', cardX + cardWidth, '下边界:', cardY + cardHeight);
      
      // 绘制卡片背景
      const backgroundColor = cardData.backgroundColor || '#CBCBE7';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      console.log('卡片背景绘制完成, 颜色:', backgroundColor);
      
      // 4. 绘制卡片内容
      console.log('步骤4: 绘制卡片内容');
      const contentPadding = 20; // 减小内边距
      const contentX = cardX + contentPadding; // 40
      const contentY = cardY + contentPadding; // 110
      
      // 5. 绘制引用文本
      console.log('步骤5: 绘制引用文本');
      ctx.fillStyle = cardData.textColor || '#595880';
      ctx.font = '14px sans-serif'; // 稍微减小字体
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const quote = cardData.quote || '愿你拥有内心的平静与美好。';
      console.log('要绘制的文本:', quote);
      
      // 文本分行处理 - 更保守的分行
      const maxLineLength = 16; // 减少每行字符数
      const lines = [];
      for (let i = 0; i < quote.length; i += maxLineLength) {
        lines.push(quote.substring(i, i + maxLineLength));
      }
      
      console.log('文本分行结果:', lines);
      
      let textY = contentY + 35; // 文本起始Y坐标
      const lineHeight = 22; // 行高
      const maxLines = 8; // 最多显示8行
      
      lines.forEach((line, index) => {
        if (index < maxLines && textY < cardY + cardHeight - 40) { // 确保不超出卡片边界
          ctx.fillText(line, contentX, textY);
          console.log(`第${index + 1}行绘制:`, line, '位置:', contentX, textY);
          textY += lineHeight;
        }
      });
      
      // 6. 绘制作者署名
      console.log('步骤6: 绘制作者署名');
      ctx.fillStyle = cardData.textColor || '#595880';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const authorY = cardY + cardHeight - 30; // 距离卡片底部30px
      ctx.fillText('— 爱你的咖啡', cardX + cardWidth - contentPadding, authorY);
      console.log('作者署名绘制完成，位置:', cardX + cardWidth - contentPadding, authorY);
      
      console.log('=== 卡片绘制全部完成 ===');
      
    } catch (error) {
      console.error('绘制过程中发生错误:', error);
      throw error;
    }
  },

  // 分享给朋友
  shareToFriend: function() {
    console.log('=== 点击分享给朋友 ===');
    
    this.generateShareImage();
  },

  // 生成分享图片 - 修复版本（解决draw回调问题）
  generateShareImage: function() {
    console.log('=== 开始生成分享图片 ===');
    
    // 立即显示加载状态
    wx.showLoading({
      title: '生成图片中...',
      mask: true
    });
    
    const canvasId = 'shareCanvas';
    const width = 375;
    const height = 500;
    
    console.log('画布配置:', { canvasId, width, height });
    
    // 使用旧版 Canvas API
    const ctx = wx.createCanvasContext(canvasId, this);
    
    if (!ctx) {
      console.error('无法创建Canvas上下文');
      wx.hideLoading();
      wx.showToast({
        title: '生成失败',
        icon: 'error'
      });
      return;
    }
    
    console.log('Canvas上下文创建成功');
    
    // 绘制卡片
    console.log('开始绘制卡片...');
    this.drawCardOldAPI(ctx, width, height);
    
    // 提交绘制
    console.log('提交绘制命令...');
    
    // 使用更可靠的方式处理draw回调
    let drawCallbackExecuted = false;
    
    // 设置超时机制，如果回调没有在合理时间内执行，强制执行转换
    const timeoutId = setTimeout(() => {
      if (!drawCallbackExecuted) {
        console.log('draw回调超时，强制执行图片转换...');
        drawCallbackExecuted = true;
        this.convertCanvasToImage(canvasId, width, height);
      }
    }, 2000); // 2秒超时
    
    // 执行draw操作
    ctx.draw(false, () => {
      console.log('绘制提交完成（回调执行）');
      
      if (!drawCallbackExecuted) {
        drawCallbackExecuted = true;
        clearTimeout(timeoutId);
        
        // 稍微延迟确保绘制完成
        setTimeout(() => {
          console.log('开始转换图片...');
          this.convertCanvasToImage(canvasId, width, height);
        }, 500);
      }
    });
    
    // 如果draw方法本身有问题，提供额外的备用机制
    setTimeout(() => {
      if (!drawCallbackExecuted) {
        console.log('draw方法可能有问题，尝试备用转换方案...');
        drawCallbackExecuted = true;
        clearTimeout(timeoutId);
        this.convertCanvasToImage(canvasId, width, height);
      }
    }, 3000); // 3秒备用超时
  },
  
  // 转换画布为图片
  convertCanvasToImage: function(canvasId, width, height) {
    console.log('=== 开始转换画布为图片 ===');
    console.log('转换参数:', { canvasId, width, height });
    
    wx.canvasToTempFilePath({
      canvasId: canvasId,
      width: width,
      height: height,
      destWidth: width * 2, // 提高分辨率
      destHeight: height * 2,
      fileType: 'png',
      quality: 1.0,
      success: (res) => {
        console.log('图片生成成功:', res.tempFilePath);
        
        wx.hideLoading();
        
        // 先预览图片确认生成成功
        wx.previewImage({
          urls: [res.tempFilePath],
          current: res.tempFilePath,
          success: () => {
            console.log('图片预览成功');
            
            // 预览成功后询问是否要分享
            wx.showModal({
              title: '图片生成成功',
              content: '是否要分享这张卡片？',
              confirmText: '分享',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 调用微信分享API
                  wx.shareAppMessage({
                    title: '来自宇宙漂流瓶的专属卡片',
                    imageUrl: res.tempFilePath,
                    query: 'from=share',
                    success: (shareRes) => {
                      console.log('分享成功', shareRes);
                      Toast({
                        context: this,
                        selector: '#t-toast',
                        message: '分享成功',
                        theme: 'success',
                        duration: 1500
                      });
                      
                      // 询问是否保存到相册
                      wx.showModal({
                        title: '保存图片',
                        content: '是否将分享图片保存到相册？',
                        success: (albumRes) => {
                          if (albumRes.confirm) {
                            this.saveImageToAlbum(res.tempFilePath);
                          }
                        }
                      });
                    },
                    fail: (err) => {
                      console.error('分享失败', err);
                      Toast({
                        context: this,
                        selector: '#t-toast',
                        message: '分享失败，请重试',
                        theme: 'error',
                        duration: 1500
                      });
                    }
                  });
                }
              }
            });
          },
          fail: (error) => {
            console.error('图片预览失败:', error);
            wx.showToast({
              title: '预览失败',
              icon: 'error'
            });
          }
        });
      },
      fail: (error) => {
        console.error('图片生成失败:', error);
        
        wx.hideLoading();
        wx.showToast({
          title: '生成失败',
          icon: 'error'
        });
      }
    }, this);
  },

  // 旧版API绘制函数 - 简化版本（移除REMINDER，更改署名）
  drawCardOldAPI: function(ctx, width, height) {
    console.log('=== 使用旧版API绘制卡片（简化版本）===');
    
    const cardData = this.data.cardData;
    const currentDate = this.data.currentDate;
    
    // 直接绘制卡片，不需要外部背景
    const backgroundColor = cardData.backgroundColor || '#CBCBE7';
    ctx.setFillStyle(backgroundColor);
    ctx.fillRect(0, 0, width, height); // 整个画布都是卡片背景
    
    // 卡片内容区域设置
    const contentPadding = 30; // 增加内边距
    const textColor = cardData.textColor || '#595880';
    
    // 1. 在卡片顶部绘制日期和标题
    // 日期部分 - 放在卡片左上角
    ctx.setFillStyle(textColor);
    ctx.setFontSize(24);
    ctx.setTextAlign('left');
    const dayText = currentDate.day || '27';
    ctx.fillText(dayText, contentPadding, 40);
    
    // 月年信息
    ctx.setFillStyle(textColor);
    ctx.setFontSize(12);
    ctx.setTextAlign('left');
    const monthYearText = currentDate.monthYear || 'Jun 2025';
    ctx.fillText(monthYearText, contentPadding, 65);
    
    // 标题 - 放在卡片右上角
    ctx.setFillStyle(textColor);
    ctx.setFontSize(16);
    ctx.setTextAlign('right');
    ctx.fillText('宇宙漂流瓶', width - contentPadding, 50);
    
    // 2. 绘制引用文本 - 放大并居中（移除REMINDER部分）
    ctx.setFillStyle(textColor);
    ctx.setFontSize(22); // 进一步增大字体，因为去掉了REMINDER部分，有更多空间
    ctx.setTextAlign('center'); // 居中对齐
    
    const quote = cardData.quote || '愿你拥有内心的平静与美好。';
    
    // 文本分行处理
    const maxLineLength = 11; // 减少每行字符数适应更大字体
    const lines = [];
    for (let i = 0; i < quote.length; i += maxLineLength) {
      lines.push(quote.substring(i, i + maxLineLength));
    }
    
    // 计算文本区域的中心点 - 因为没有REMINDER，可以从更高位置开始
    const textAreaCenterX = width / 2; // 画布水平中心
    const availableHeight = height - 150; // 可用高度（减去顶部日期和底部署名空间）
    const totalTextHeight = lines.length * 35; // 每行35px高度
    let textStartY = 100 + (availableHeight - totalTextHeight) / 2; // 垂直居中
    
    const lineHeight = 35; // 增加行高
    const maxLines = 8;
    
    lines.forEach((line, index) => {
      if (index < maxLines && textStartY < height - 80) {
        ctx.fillText(line, textAreaCenterX, textStartY);
        textStartY += lineHeight;
      }
    });
    
    // 3. 绘制作者署名 - 改为COLORSURF
    ctx.setFillStyle(textColor);
    ctx.setFontSize(14);
    ctx.setTextAlign('right');
    const authorY = height - 30; // 距离底部30px
    ctx.fillText('— COLORSURF', width - contentPadding, authorY);
    
    console.log('=== 旧版API卡片绘制完成 ===');
  },
  
  handleReadAnother: function() {
    console.log('Read Another button tapped');
    
    // 如果有保存的云函数参数，重新调用云函数
    if (this.chatgptParams && this.colorpsychologyParams) {
      // 显示加载状态
      wx.showLoading({
        title: '正在生成新的专属内容...',
        mask: true
      });
      
      // 第一步：调用chatgpt云函数生成新文字
      wx.cloud.callFunction({
        name: 'chatgpt',
        data: {
          ...this.chatgptParams,
          sessionId: 'readanother_' + Date.now() // 使用新的sessionId
        },
        success: res => {
          console.log('再读一则-文本生成成功：', res);
          
          const result = res.result;
          let newQuote = '愿你拥有内心的平静与美好。'; // 默认文字
          
          if (result && result.success && result.reply) {
            newQuote = result.reply;
          }
          
          // 第二步：调用colorpsychology云函数生成新颜色
          wx.cloud.callFunction({
            name: 'colorpsychology',
            data: this.colorpsychologyParams,
            success: colorRes => {
              console.log('再读一则-颜色生成成功：', colorRes);
              
              let newBackgroundColor = this.data.cardData.backgroundColor;
              let newTextColor = this.data.cardData.textColor;
              
              const colorResult = colorRes.result;
              if (colorResult && colorResult.success && colorResult.selectedColor) {
                newBackgroundColor = colorResult.selectedColor.background;
                newTextColor = colorResult.selectedColor.text;
              }
              
              // 更新卡片数据
              this.setData({
                'cardData.quote': newQuote,
                'cardData.backgroundColor': newBackgroundColor,
                'cardData.textColor': newTextColor
              });
              
              wx.hideLoading();
              Toast({
                context: this,
                selector: '#t-toast',
                message: '已更新专属内容',
                theme: 'success',
                duration: 1000
              });
            },
            fail: colorErr => {
              console.error('再读一则-颜色生成失败：', colorErr);
              // 只更新文字，保持原有颜色
              this.setData({
                'cardData.quote': newQuote
              });
              
              wx.hideLoading();
              Toast({
                context: this,
                selector: '#t-toast',
                message: '已更新专属内容',
                theme: 'success',
                duration: 1000
              });
            }
          });
        },
        fail: err => {
          console.error('再读一则-文本生成失败：', err);
          
          // 文本生成失败，使用随机默认文字
          const defaultQuotes = [
            "生活就像一杯咖啡，苦涩中带着香醇。",
            "每一次日出都是一个新的开始，充满希望。",
            "保持微笑，世界也会对你微笑。",
            "勇敢地追求自己的梦想，不要害怕失败。",
            "愿你拥有内心的平静与美好。"
          ];
          
          const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
          
          this.setData({
            'cardData.quote': defaultQuotes[randomIndex]
          });
          
          wx.hideLoading();
          Toast({
            context: this,
            selector: '#t-toast',
            message: '已更新专属内容',
            theme: 'success',
            duration: 1000
          });
        }
      });
    } else {
      // 如果没有保存的参数，使用原来的随机逻辑
      const quotes = [
        "生活就像一杯咖啡，苦涩中带着香醇。",
        "每一次日出都是一个新的开始，充满希望。",
        "保持微笑，世界也会对你微笑。",
        "勇敢地追求自己的梦想，不要害怕失败。"
      ];
      
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
        message: '已更新专属内容',
        theme: 'success',
        duration: 1000
      });
    }
  },

  // 保存图片到相册
  saveImageToAlbum: function(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '图片已保存到相册',
          theme: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth')) {
          // 权限被拒绝，引导用户开启权限
          wx.showModal({
            title: '权限申请',
            content: '需要您授权保存图片到相册，请在设置中开启权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '保存失败',
            theme: 'error',
            duration: 1500
          });
        }
      }
    });
  },
});
