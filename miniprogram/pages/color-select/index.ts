// color-select/index.ts
Component({
  data: {
    selectedColor: -1, // -1 表示未选择任何颜色
    colors: [
      {
        name: "蓝色",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        meaning: "平静、稳定、信任。蓝色能给人带来宁静和放松的感觉，有助于缓解压力。"
      },
      {
        name: "红色",
        gradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
        meaning: "热情、力量、激励。红色代表活力和热情，能够激发您的内在动力。"
      },
      {
        name: "绿色",
        gradient: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
        meaning: "成长、和谐、平衡。绿色象征着自然和新生，能够带来平衡与和谐感。"
      },
      {
        name: "黄色",
        gradient: "linear-gradient(135deg, #fcb045 0%, #fd1d1d 100%)",
        meaning: "快乐、创造力、乐观。黄色能够带来阳光般的温暖，激发创造力和希望。"
      },
      {
        name: "紫色",
        gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        meaning: "神秘、智慧、灵感。紫色与高贵和深度思考相关，能够激发直觉和创造力。"
      },
      {
        name: "橙色",
        gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
        meaning: "活力、温暖、友善。橙色代表着友好和社交，能够带来愉悦感。"
      },
      {
        name: "粉色",
        gradient: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
        meaning: "爱、温柔、关怀。粉色象征着温柔与关爱，能够带来舒适和安全感。"
      },
      {
        name: "灰色",
        gradient: "linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)",
        meaning: "中立、平衡、冷静。灰色代表着中立与沉稳，有助于保持情绪的平衡。"
      },
      {
        name: "黑色",
        gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        meaning: "力量、优雅、神秘。黑色象征着力量与深度，能够帮助您发现内心的坚韧。"
      }
    ]
  },
  methods: {
    // 选择颜色
    selectColor(e: any) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        selectedColor: index
      });
    },
    
    // 生成卡片并跳转到结果页
    generateCard() {
      if (this.data.selectedColor === -1) {
        wx.showToast({
          title: '请选择一种颜色',
          icon: 'none'
        });
        return;
      }
      
      const selectedColor = this.data.colors[this.data.selectedColor];
      
      // 跳转到卡片结果页，传递颜色参数
      wx.navigateTo({
        url: `/pages/card-result/index?color=${selectedColor.name}&type=color`
      });
    }
  },
  lifetimes: {
    attached() {
      console.log('Color select page attached');
    }
  }
});
