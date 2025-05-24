// card-result/index.ts
Component({
  data: {
    isFlipped: false, // 卡片是否翻转
    type: '', // 来源类型：text, color, image
    // 卡片正面内容
    cardFront: {
      image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
      title: '宁静时刻',
      subtitle: '让心灵沉浸在阅读的宁静时光中'
    },
    // 卡片背面内容
    cardBack: {
      quote: '当您沉浸在书中的世界，您的心灵正在获得最真实的休息。阅读不仅是知识的获取，更是心灵的疗愈。请记住，每一页翻动都是一次内心的对话，每一次思考都是自我成长的契机。'
    },
    // 推荐卡片
    recommendations: [
      {
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        title: '咖啡时光',
        subtitle: '放慢脚步，享受当下'
      },
      {
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        title: '宁静山景',
        subtitle: '远离喧嚣，寻找平静'
      },
      {
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1738&q=80',
        title: '温暖灯光',
        subtitle: '家的温馨与舒适'
      },
      {
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        title: '音乐时刻',
        subtitle: '聆听内心的声音'
      }
    ],
    // 卡片内容库
    cardContents: {
      text: {
        quotes: [
          '在生活的喧嚣中，请记得为自己留一片宁静的空间。当外界的声音变得嘈杂，那是您需要聆听内心声音的时刻。您的感受是有价值的，您的思考是重要的。',
          '每一次挑战都是成长的机会，每一次困境都蕴含着转机。您所经历的一切，无论是顺境还是逆境，都在塑造着更加坚强和智慧的您。',
          '请对自己温柔一些，接纳自己的不完美。完美并不是人生的目标，真实地活着，感受每一刻的体验，才是最珍贵的旅程。'
        ]
      },
      color: {
        blue: {
          image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1626&q=80',
          title: '平静海洋',
          subtitle: '让心灵如海洋般宽广平静',
          quote: '平静如海的心境，是内心强大的体现。当您面对生活的波涛时，请记住：您的内心可以如同深海一般，表面有波澜，深处却始终平静。'
        },
        red: {
          image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1738&q=80',
          title: '热情能量',
          subtitle: '点燃内心的热情与动力',
          quote: '热情是推动我们前行的燃料。当您感到疲惫时，请回想那些让您心跳加速的时刻，让内心的火焰重新燃起，照亮前行的道路。'
        },
        green: {
          image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
          title: '自然和谐',
          subtitle: '在自然中找回内心的平衡',
          quote: '大自然是最好的治愈师。当您感到迷失或不平衡时，请回归自然，聆听树叶的沙沙声，感受阳光的温暖，让心灵在大自然的怀抱中重获平衡与和谐。'
        },
        yellow: {
          image: 'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?ixlib=rb-4.0.3&auto=format&fit=crop&w=1742&q=80',
          title: '阳光能量',
          subtitle: '拥抱乐观与积极的人生态度',
          quote: '乐观就像阳光，能照亮您前行的道路。无论遇到什么困难，请记住，乌云之上永远是晴天。保持希望，相信美好，您会发现生活处处有惊喜。'
        },
        purple: {
          image: 'https://images.unsplash.com/photo-1510279770292-4b34de9f5c23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
          title: '智慧之光',
          subtitle: '探索内心的深度与智慧',
          quote: '静心反思是通往智慧的道路。在忙碌的生活中，请给自己留一些独处的时间，倾听内心的声音，您会发现自己比想象中更加坚强和智慧。'
        }
      },
      image: {
        '宁静山景': {
          quote: '山的宁静给予我们内心的力量。在喧嚣的世界中，请记得为自己留一片宁静的空间，就像高山之巅的那片蓝天，让思绪自由翱翔。'
        },
        '咖啡时光': {
          quote: '一杯咖啡，一段时光。当您品味咖啡的醇香时，也是在品味生活的细节。请放慢脚步，享受这短暂的时光，让心灵在香气中得到片刻的宁静。'
        },
        '阅读时光': {
          quote: '当您沉浸在书中的世界，您的心灵正在获得最真实的休息。阅读不仅是知识的获取，更是心灵的疗愈。每一页翻动都是一次内心的对话，每一次思考都是自我成长的契机。'
        },
        '温暖灯光': {
          quote: '温暖的灯光如同希望，即使在最黑暗的时刻也能照亮前方。请记住，无论经历怎样的风雨，内心的光芒永远不会熄灭，它会指引您找到归途。'
        },
        '海洋宁静': {
          quote: '海洋教会我们包容与坚韧。面对生活的起伏，请保持如大海般的胸怀，接纳一切，不执着于细节，同时又像海浪一样，永不放弃向前的力量。'
        },
        '音乐时刻': {
          quote: '音乐是心灵的语言，能够表达文字无法传达的情感。当您沉浸在音乐中时，请允许自己完全感受，无论是喜悦还是悲伤，都是真实而宝贵的体验。'
        }
      }
    }
  },
  methods: {
    // 翻转卡片
    flipCard() {
      this.setData({
        isFlipped: !this.data.isFlipped
      });
    },
    
    // 分享卡片
    shareCard() {
      wx.showToast({
        title: '分享功能开发中',
        icon: 'none'
      });
    },
    
    // 保存卡片
    saveCard() {
      wx.showToast({
        title: '保存功能开发中',
        icon: 'none'
      });
    },
    
    // 重新生成卡片
    regenerateCard() {
      const type = this.data.type;
      
      if (type === 'text') {
        // 返回文字输入页面
        wx.navigateBack();
      } else if (type === 'color') {
        // 返回颜色选择页面
        wx.navigateBack();
      } else if (type === 'image') {
        // 返回图片选择页面
        wx.navigateBack();
      }
    },
    
    // 查看推荐卡片
    viewRecommendation(e: any) {
      const index = e.currentTarget.dataset.index;
      const recommendation = this.data.recommendations[index];
      
      wx.showToast({
        title: `已选择: ${recommendation.title}`,
        icon: 'none'
      });
    },
    
    // 根据类型和选择设置卡片内容
    setCardContent(type: string, param: string) {
      if (type === 'text') {
        // 文字输入类型，随机选择一条疗愈语句
        const quotes = this.data.cardContents.text.quotes;
        const randomIndex = Math.floor(Math.random() * quotes.length);
        
        this.setData({
          'cardBack.quote': quotes[randomIndex]
        });
      } else if (type === 'color') {
        // 颜色选择类型
        const colorName = param.toLowerCase();
        const colorContent = this.data.cardContents.color[colorName];
        
        if (colorContent) {
          this.setData({
            'cardFront.image': colorContent.image,
            'cardFront.title': colorContent.title,
            'cardFront.subtitle': colorContent.subtitle,
            'cardBack.quote': colorContent.quote
          });
        }
      } else if (type === 'image') {
        // 图片选择类型
        const imageTitle = param;
        const imageContent = this.data.cardContents.image[imageTitle];
        
        if (imageContent) {
          this.setData({
            'cardBack.quote': imageContent.quote
          });
        }
      }
    }
  },
  lifetimes: {
    attached() {
      // 获取页面参数
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      
      const type = options.type || 'text';
      this.setData({ type });
      
      // 根据不同类型设置卡片内容
      if (type === 'text') {
        const text = decodeURIComponent(options.text || '');
        this.setCardContent('text', text);
      } else if (type === 'color') {
        const color = options.color || 'blue';
        this.setCardContent('color', color);
      } else if (type === 'image') {
        const imageTitle = decodeURIComponent(options.image || '');
        const imageSrc = decodeURIComponent(options.imageSrc || '');
        
        // 设置图片
        this.setData({
          'cardFront.image': imageSrc,
          'cardFront.title': imageTitle
        });
        
        this.setCardContent('image', imageTitle);
      }
    }
  }
});
