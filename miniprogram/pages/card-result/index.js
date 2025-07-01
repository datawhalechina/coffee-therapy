// 获取toast实例
import Toast from 'tdesign-miniprogram/toast/index';
import config from '../../config/env';

Page({
  data: {
    cloudEnvId: config.cloudEnv, // 云环境ID
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
  setCurrentDate: function () {
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

  onLoad: function (options) {
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

    // 页面加载时隐藏所有可能的过渡动画
    try {
      // 尝试获取页面栈中的前一个页面，并隐藏其过渡动画
      const pages = getCurrentPages();
      if (pages.length > 1) {
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.hideTransition) {
          prevPage.hideTransition();
        }
        if (prevPage && prevPage.setData) {
          prevPage.setData({
            showLoadingTransition: false
          });
        }
      }
    } catch (error) {
      console.log('隐藏前页过渡动画时出错:', error);
    }

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

    // 5. 处理文本分行显示
    if (updatedCardData.quote) {
      const processedText = this.processTextForDisplay(updatedCardData.quote);
      updatedCardData.processedQuote = processedText;
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

  handleShare: function () {
    console.log('Share button tapped');

    // 直接调用生成分享图片，不再使用Promise方式
    this.generateShareImage();
  },

  // 绘制卡片内容 - 修复版本，参考测试成功的方法
  drawCard: function (ctx, width, height) {
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
      ctx.font = '15px sans-serif'; // 稍微减小字体
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
  shareToFriend: function () {
    console.log('=== 点击分享给朋友 ===');

    this.generateShareImage();
  },

  // 生成分享图片 - 修复版本（解决draw回调问题）
  generateShareImage: function () {
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
  convertCanvasToImage: function (canvasId, width, height) {
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


        // 预览成功后询问是否要分享
        wx.showModal({
          title: '图片生成成功',
          content: '是否要分享这张卡片？',
          confirmText: '分享',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 调用微信分享API
              wx.showShareImageMenu({
                path: res.tempFilePath,
                success: (shareRes) => {
                  console.log('分享成功', shareRes);
                  Toast({
                    context: this,
                    selector: '#t-toast',
                    message: '分享成功',
                    theme: 'success',
                    duration: 1500
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

  // 旧版API绘制函数 - 使用统一的智能分行逻辑
  drawCardOldAPI: function (ctx, width, height) {
    console.log('=== 使用旧版API绘制卡片（优化文本布局）===');

    const cardData = this.data.cardData;
    const currentDate = this.data.currentDate;

    // 直接绘制卡片，不需要外部背景
    const backgroundColor = cardData.backgroundColor || '#CBCBE7';
    ctx.setFillStyle(backgroundColor);
    ctx.fillRect(0, 0, width, height); // 整个画布都是卡片背景

    // 卡片内容区域设置
    const contentPadding = 30; // 减少内边距，让文字距离两边更近
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

    // 2. 绘制引用文本 - 使用统一的智能分行处理
    ctx.setFillStyle(textColor);
    ctx.setFontSize(26); // 增大字体从22到26
    ctx.setTextAlign('center'); // 居中对齐

    const quote = cardData.quote || '愿你拥有内心的平静与美好。';

    // 优先使用已处理的分行文本，否则重新处理
    let textLines = [];
    if (cardData.processedQuote && cardData.processedQuote.lines) {
      // 使用已经处理好的分行文本
      textLines = cardData.processedQuote.lines;
      console.log('使用预处理分行文本:', textLines);
    } else {
      // 实时处理文本分行
      const processedText = this.processTextForDisplay(quote);
      textLines = processedText.lines || [];
      console.log('实时处理分行文本:', textLines);
    }

    console.log('最终用于绘制的分行文本:', textLines);

    // 计算文本区域的中心点
    const textAreaCenterX = width / 2; // 画布水平中心
    const availableHeight = height - 150; // 可用高度
    const totalTextHeight = textLines.length * 40; // 每行40px高度，增加行高
    let textStartY = 100 + (availableHeight - totalTextHeight) / 2; // 垂直居中

    const lineHeight = 40; // 增加行高从35到40
    const maxLines = 10; // 增加最大行数

    textLines.forEach((line, index) => {
      if (index < maxLines && textStartY < height - 80) {
        ctx.fillText(line.trim(), textAreaCenterX, textStartY); // 去除行首尾空格
        console.log(`第${index + 1}行绘制:`, line.trim(), '位置:', textAreaCenterX, textStartY);
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

  handleReadAnother: function () {
    console.log('Read Another button tapped');

    // 如果有保存的云函数参数，重新调用云函数
    if (this.chatgptParams && this.colorpsychologyParams) {
      // 显示加载状态
      wx.showLoading({
        title: '正在生成卡片',
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

          // 第二步：检查是否使用本地颜色生成
          if (this.colorpsychologyParams.useLocalRandomColor) {
            // 使用本地随机颜色生成
            const selectedColor = this.generateRandomColor();
            console.log('再读一则-使用本地默认颜色：', selectedColor);

            // 更新卡片数据
            this.setData({
              'cardData.quote': newQuote,
              'cardData.backgroundColor': selectedColor.background,
              'cardData.textColor': selectedColor.text
            });

            // 处理新文本的分行显示
            const processedText = this.processTextForDisplay(newQuote);
            this.setData({
              'cardData.processedQuote': processedText
            });

            wx.hideLoading();
            Toast({
              context: this,
              selector: '#t-toast',
              message: '已更新专属内容',
              theme: 'success',
              duration: 1000
            });
          } else {
            // 使用云函数生成颜色
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

                // 处理新文本的分行显示
                const processedText = this.processTextForDisplay(newQuote);
                this.setData({
                  'cardData.processedQuote': processedText
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

                // 处理新文本的分行显示
                const processedText = this.processTextForDisplay(newQuote);
                this.setData({
                  'cardData.processedQuote': processedText
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
          }
        },
        fail: err => {
          console.error('再读一则-文本生成失败：', err);
          
          // 使用默认文字
          const defaultQuote = '愿你拥有内心的平静与美好。';
          
          // 检查是否使用本地颜色生成
          if (this.colorpsychologyParams.useLocalRandomColor) {
            // 使用本地随机颜色生成
            const selectedColor = this.generateRandomColor();
            console.log('再读一则-使用本地默认颜色：', selectedColor);

            // 更新卡片数据
            this.setData({
              'cardData.quote': defaultQuote,
              'cardData.backgroundColor': selectedColor.background,
              'cardData.textColor': selectedColor.text
            });

            // 处理新文本的分行显示
            const processedText = this.processTextForDisplay(defaultQuote);
            this.setData({
              'cardData.processedQuote': processedText
            });

            wx.hideLoading();
            Toast({
              context: this,
              selector: '#t-toast',
              message: '已更新专属内容',
              theme: 'success',
              duration: 1000
            });
          } else {
            // 使用云函数生成颜色
            wx.cloud.callFunction({
              name: 'colorpsychology',
              data: this.colorpsychologyParams,
              success: colorRes => {
                console.log('再读一则-默认颜色生成成功：', colorRes);

                let newBackgroundColor = this.data.cardData.backgroundColor;
                let newTextColor = this.data.cardData.textColor;

                const colorResult = colorRes.result;
                if (colorResult && colorResult.success && colorResult.selectedColor) {
                  newBackgroundColor = colorResult.selectedColor.background;
                  newTextColor = colorResult.selectedColor.text;
                }

                // 更新卡片数据
                this.setData({
                  'cardData.quote': defaultQuote,
                  'cardData.backgroundColor': newBackgroundColor,
                  'cardData.textColor': newTextColor
                });

                // 处理新文本的分行显示
                const processedText = this.processTextForDisplay(defaultQuote);
                this.setData({
                  'cardData.processedQuote': processedText
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
                console.error('再读一则-默认颜色生成失败：', colorErr);
                
                // 只更新文字，保持原有颜色
                this.setData({
                  'cardData.quote': defaultQuote
                });

                // 处理新文本的分行显示
                const processedText = this.processTextForDisplay(defaultQuote);
                this.setData({
                  'cardData.processedQuote': processedText
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
          }
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

      // 处理新文本的分行显示
      const processedText = this.processTextForDisplay(quotes[randomIndex]);
      this.setData({
        'cardData.processedQuote': processedText
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
  saveImageToAlbum: function (tempFilePath) {
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

  // 处理文本显示格式 - 智能中英文换行（带行长度限制）
  processTextForDisplay: function(text) {
    if (!text) return { lines: [] };

    console.log('开始处理文本:', text);

    // 设置每行最大字符数（中文字符按2个单位计算）
    const maxLineWidth = 16; // 每行最多16个字符宽度单位

    // 智能分割中英文文本
    const segments = this.splitTextByLanguage(text);
    console.log('分割后的段落:', segments);

    const lines = [];
    let currentLine = '';

    segments.forEach((segment, index) => {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) return;

      // 判断当前段落是否为英文开头
      const isEnglishStart = /^[a-zA-Z]/.test(trimmedSegment);
      
      // 如果当前行已有内容，且新段落是英文开头，则另起一行
      if (currentLine && isEnglishStart) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = '';
      }

      // 将当前段落按字符/单词分割处理
      if (isEnglishStart) {
        // 英文段落按单词处理
        const words = trimmedSegment.split(/\s+/);
        for (const word of words) {
          const spaceNeeded = currentLine.trim() ? ' ' : '';
          const testLine = currentLine + spaceNeeded + word;
          
          if (this.calculateTextWidth(testLine) <= maxLineWidth) {
            currentLine += spaceNeeded + word;
          } else {
            // 超过行宽，另起一行
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = word;
          }
        }
      } else {
        // 中文段落按字符处理
        for (let i = 0; i < trimmedSegment.length; i++) {
          const char = trimmedSegment[i];
          const testLine = currentLine + char;
          
          if (this.calculateTextWidth(testLine) <= maxLineWidth) {
            currentLine += char;
          } else {
            // 超过行宽，另起一行
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = char;
          }
        }
      }
    });

    // 添加最后一行
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    console.log('最终分行结果:', lines);
    
    return {
      lines: lines
    };
  },

  // 计算文本宽度（中文字符占2个单位，英文字符占1个单位）
  calculateTextWidth: function(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[\u4e00-\u9fa5]/.test(char)) {
        width += 2; // 中文字符占2个单位宽度
      } else {
        width += 1; // 英文字符、数字、符号占1个单位宽度
      }
    }
    return width;
  },

  // 按语言类型分割文本 - 改进版
  splitTextByLanguage: function(text) {
    const segments = [];
    let currentSegment = '';
    let lastType = null; // 'chinese' | 'english' | null

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 判断字符类型
      const isChinese = /[\u4e00-\u9fa5]/.test(char);
      const isEnglish = /[a-zA-Z]/.test(char);
      const isSpace = char === ' ';
      const isPunctuation = /[，。、！？；：""''（）【】,.!?;:()[\]"-]/.test(char);

      let currentType = null;
      if (isChinese) {
        currentType = 'chinese';
      } else if (isEnglish) {
        currentType = 'english';
      } else if (isPunctuation) {
        // 标点符号跟随前一个字符的类型
        currentType = lastType;
      } else if (isSpace) {
        // 空格跟随前一个字符的类型
        currentType = lastType;
      }

      // 如果语言类型发生变化，结束当前段落
      if (lastType && currentType && lastType !== currentType && !isSpace && !isPunctuation) {
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
        }
        currentSegment = char;
        lastType = currentType;
      } else {
        currentSegment += char;
        if (currentType) {
          lastType = currentType;
        }
      }
    }

    // 添加最后一个段落
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }

    return segments;
  },
});
