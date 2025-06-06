// text-input/index.js

Component({
  data: {
    // 页面数据
    inputText: '',
    textCount: 0,
    exampleTexts: ['工作压力很大', '感到焦虑不安', '需要放松心情', '寻找生活方向'],
    selectedExample: -1, // -1 表示未选择任何示例
    isLoading: false, // 加载状态
    loadingText: '', // 加载提示文本
    cloudEnvId: 'cloud1-4gythsnw8615145d' // 云环境ID
  },
  
  lifetimes: {
    // 在组件实例被创建时执行
    attached: function() {
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
    }
  },
  
  methods: {
    // 文本输入变化事件
    onTextChange: function(e) {
      const text = e.detail.value || '';
      this.setData({
        inputText: text,
        textCount: text.length
      });
    },
    
    // 选择示例文本
    selectExample: function(e) {
      const index = e.currentTarget.dataset.index;
      const text = this.data.exampleTexts[index];
      
      this.setData({
        selectedExample: index,
        inputText: text,
        textCount: text.length
      });
    },
    
    // 生成卡片
    generateCard: function() {
      const text = this.data.inputText;
      if (!text) return;
      
      this.setData({
        isLoading: true,
        loadingText: '正在准备卡片...'
      });

      const cardData = {
        text: encodeURIComponent(text),
        quote: encodeURIComponent(text) // Use input text directly as the quote
      };

      // Assign a random color (as in previous logic)
      const colors = ['blue', 'red', 'green'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      cardData.color = randomColor;

      // Navigate to the result page
      this.navigateToCardResult(cardData);
    },
    
    // 跳转到卡片结果页
    navigateToCardResult: function(cardData) {
      // 构建跳转 URL
      let url = `/pages/card-result/index?text=${cardData.text}&quote=${cardData.quote}&color=${cardData.color}`;
      // imageTaskId is no longer used
      
      // 执行跳转
      wx.navigateTo({
        url: url,
        success: () => {
          console.log('成功跳转到卡片结果页');
        },
        complete: () => {
          // 重置加载状态
          this.setData({
            isLoading: false,
            loadingText: ''
          });
        }
      });
    }
  }
});
