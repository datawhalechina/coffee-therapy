// image-select/index.ts
Component({
  data: {
    activeTab: 'all', // 默认显示全部
    selectedImage: -1, // -1 表示未选择任何图片
    categories: [
      { label: '全部', value: 'all' },
      { label: '自然风景', value: 'nature' },
      { label: '宁静时刻', value: 'peaceful' },
      { label: '咖啡时光', value: 'coffee' },
      { label: '生活细节', value: 'lifestyle' }
    ],
    images: [
      {
        title: '宁静山景',
        src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'nature',
        meaning: '宁静的自然风景能让人感到平静与放松，远离喧嚣，让心灵回归最纯净的状态。'
      },
      {
        title: '咖啡时光',
        src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'coffee',
        meaning: '咖啡时光代表着放慢脚步，享受当下的美好。品味生活的细节，让心灵获得片刻的宁静。'
      },
      {
        title: '阅读时光',
        src: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'peaceful',
        meaning: '阅读是一种心灵的旅行，能让思绪得到放松。在书中寻找智慧，在字里行间找到共鸣。'
      },
      {
        title: '温暖灯光',
        src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1738&q=80',
        category: 'lifestyle',
        meaning: '温暖的灯光代表着希望和温馨的家庭氛围，在柔和的光线中，找到内心的安定与平静。'
      },
      {
        title: '海洋宁静',
        src: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1626&q=80',
        category: 'nature',
        meaning: '海洋的宽广让人感到自由与无限可能，面对大海，我们的烦恼显得渺小，心胸也随之开阔。'
      },
      {
        title: '音乐时刻',
        src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80',
        category: 'lifestyle',
        meaning: '音乐是心灵的语言，能够抚慰疲惫的心灵，让情绪得到释放，找到内心的平衡。'
      }
    ],
    filteredImages: [] // 根据分类筛选后的图片
  },
  methods: {
    // 选项卡切换
    onTabChange(e: any) {
      const value = e.detail.value;
      this.setData({
        activeTab: value,
        selectedImage: -1 // 切换分类时重置选中状态
      });
      this.filterImages(value);
    },
    
    // 筛选图片
    filterImages(category: string) {
      if (category === 'all') {
        this.setData({ filteredImages: this.data.images });
      } else {
        const filtered = this.data.images.filter(img => img.category === category);
        this.setData({ filteredImages: filtered });
      }
    },
    
    // 选择图片
    selectImage(e: any) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        selectedImage: index
      });
    },
    
    // 生成卡片并跳转到结果页
    generateCard() {
      if (this.data.selectedImage === -1) {
        wx.showToast({
          title: '请选择一张图片',
          icon: 'none'
        });
        return;
      }
      
      const selectedImage = this.data.filteredImages[this.data.selectedImage];
      
      // 跳转到卡片结果页，传递图片参数
      wx.navigateTo({
        url: `/pages/card-result/index?image=${encodeURIComponent(selectedImage.title)}&imageSrc=${encodeURIComponent(selectedImage.src)}&type=image`
      });
    }
  },
  lifetimes: {
    attached() {
      // 初始化显示全部图片
      this.filterImages('all');
    }
  }
});
