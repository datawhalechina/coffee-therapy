// index.ts
// 选择捕捉方式页面

Component({
  data: {
    // 页面数据
    timerInterval: null as any,
    isLoading: false
  },
  methods: {
    // 导航到其他页面
    navigateTo(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.navigateTo({
        url: url,
      });
    },
    
    // 调用云函数存储数据到数据库
    storeDataToCloud() {
      // 防止重复调用
      if (this.data.isLoading) {
        return;
      }
      
      this.setData({
        isLoading: true
      });
      
      console.log('开始调用云函数 printHelloWorld');
      
      // 调用云函数
      wx.cloud.callFunction({
        name: 'printHelloWorld',
        data: {},
        success: (res) => {
          console.log('云函数调用成功:', res);
        },
        fail: (err) => {
          console.error('云函数调用失败:', err);
        },
        complete: () => {
          this.setData({
            isLoading: false
          });
        }
      });
    }
  },
  lifetimes: {
    attached() {
      // 页面加载时的逻辑
      console.log('Index page attached');
      
      // 初始化云环境
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      } else {
        wx.cloud.init({
          env: 'cloud1-4gythsnw8615145d',
          traceUser: true,
        });
        
        // 设置定时任务，每5秒执行一次 storeDataToCloud 方法
        // 使用 setInterval，时间间隔为 5 * 1000 毫秒（5秒）
        // this.data.timerInterval = setInterval(() => {
        //   this.storeDataToCloud();
        // }, 5 ); // 5秒间隔
        
        // 立即执行一次，不用等待5秒
        this.storeDataToCloud();
      }
    },
    
    detached() {
      // 页面卸载时清除定时器，防止内存泄漏
      if (this.data.timerInterval) {
        clearInterval(this.data.timerInterval);
        this.data.timerInterval = null;
      }
    }
  }
})
