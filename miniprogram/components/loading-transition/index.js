Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    gifDuration: 3000 // GIF动画持续时间，单位：毫秒
  },

  methods: {
    // 显示过渡动画
    showTransition() {
      this.setData({
        show: true
      });
    },

    // 隐藏过渡动画
    hideTransition() {
      this.setData({
        show: false
      });
    },

    // 延迟隐藏过渡动画（等待GIF播放完成）
    hideTransitionWithDelay() {
      setTimeout(() => {
        this.hideTransition();
      }, this.data.gifDuration);
    },

    // GIF加载完成
    onGifLoaded() {
      console.log('过渡动画GIF加载完成');
    },

    // GIF加载错误
    onGifError(e) {
      console.error('过渡动画GIF加载失败:', e.detail);
      console.log('尝试的GIF路径: /assets/加载过渡动画.gif');
      // 如果GIF加载失败，仍然显示背景动画
    }
  }
}); 