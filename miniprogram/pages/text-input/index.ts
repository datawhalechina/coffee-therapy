// text-input/index.ts
Component({
  data: {
    // 页面数据
    inputText: '',
    textCount: 0,
    exampleTexts: ['工作压力很大', '感到焦虑不安', '需要放松心情', '寻找生活方向'],
    selectedExample: -1 // -1 表示未选择任何示例
  },
  methods: {
    // 文本输入变化事件
    onTextChange(e: any) {
      const text = e.detail.value || '';
      this.setData({
        inputText: text,
        textCount: text.length,
        selectedExample: -1 // 用户输入时重置选中的示例
      });
    },
    
    // 选择示例文本
    selectExample(e: any) {
      const index = e.currentTarget.dataset.index;
      const selectedText = this.data.exampleTexts[index];
      this.setData({
        inputText: selectedText,
        textCount: selectedText.length,
        selectedExample: index
      });
    },
    
    // 生成卡片并跳转到结果页
    generateCard() {
      if (!this.data.inputText) {
        wx.showToast({
          title: '请输入文字内容',
          icon: 'none'
        });
        return;
      }
      
      // 跳转到卡片结果页，传递文本参数
      wx.navigateTo({
        url: `/pages/card-result/index?text=${encodeURIComponent(this.data.inputText)}&type=text`
      });
    }
  },
  lifetimes: {
    attached() {
      console.log('Text input page attached');
    }
  }
});
