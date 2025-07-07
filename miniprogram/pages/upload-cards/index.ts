Page({
  /**
   * 页面的初始数据
   */
  data: {
    uploading: false,
    uploadResult: null as any,
    logs: [] as string[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.addLog('页面加载完成')
  },

  /**
   * 添加日志
   */
  addLog(message: string) {
    const logs = this.data.logs
    const timestamp = new Date().toLocaleTimeString()
    logs.push(`[${timestamp}] ${message}`)
    this.setData({ logs })
    console.log(message)
  },

  /**
   * 上传数据到rainbowcard数据库
   */
  async uploadData() {
    if (this.data.uploading) {
      wx.showToast({
        title: '正在上传中...',
        icon: 'none'
      })
      return
    }

    this.setData({
      uploading: true,
      uploadResult: null
    })

    this.addLog('开始上传疗愈卡片数据...')

    try {
      wx.showLoading({
        title: '上传中...'
      })

      // 调用云函数上传数据
      const result = await wx.cloud.callFunction({
        name: 'uploadRainbowCards',
        data: {
          action: 'upload',
          clearFirst: true, // 先清空数据库
          batchSize: 20     // 每批上传20条
        }
      })

      wx.hideLoading()
      
      this.addLog(`云函数调用成功: ${JSON.stringify(result)}`)
      
      const res = result.result as any
      if (res?.success) {
        this.addLog('✅ 数据上传成功！')
        this.setData({ uploadResult: res })
        
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        })
      } else {
        throw new Error(res?.error || '上传失败')
      }

    } catch (error: any) {
      wx.hideLoading()
      this.addLog(`❌ 上传失败: ${error.message}`)
      
      console.error('上传失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    } finally {
      this.setData({ uploading: false })
    }
  },

  /**
   * 验证数据库数据
   */
  async validateData() {
    this.addLog('开始验证数据库数据...')

    try {
      wx.showLoading({
        title: '验证中...'
      })

      const result = await wx.cloud.callFunction({
        name: 'uploadRainbowCards',
        data: {
          action: 'validate'
        }
      })

      wx.hideLoading()
      
      const res = result.result as any
      this.addLog(`验证结果: ${JSON.stringify(res, null, 2)}`)
      
      if (res?.success) {
        const details = res.details
        this.addLog(`✅ 验证完成！数据库共有 ${details.total} 条记录`)
        
        // 显示颜色统计
        Object.entries(details.colorStats || {}).forEach(([color, count]) => {
          this.addLog(`  ${color}: ${count} 张`)
        })
        
        // 显示问题（如果有）
        if (details.issues && details.issues.length > 0) {
          this.addLog(`⚠️ 发现 ${details.issues.length} 个问题:`)
          details.issues.forEach((issue: any, index: number) => {
            this.addLog(`  ${index + 1}. ID:${issue.id} - ${issue.issue}`)
          })
        } else {
          this.addLog('✅ 数据完整性检查通过')
        }
        
        wx.showToast({
          title: '验证完成',
          icon: 'success'
        })
      } else {
        throw new Error(res?.error || '验证失败')
      }

    } catch (error: any) {
      wx.hideLoading()
      this.addLog(`❌ 验证失败: ${error.message}`)
      
      console.error('验证失败:', error)
              wx.showToast({
          title: '验证失败',
          icon: 'none'
        })
    }
  },

  /**
   * 清空数据库
   */
  async clearDatabase() {
    const self = this
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空rainbowcard数据库中的所有数据吗？此操作不可逆！',
      success: async (res) => {
        if (res.confirm) {
          self.addLog('开始清空数据库...')

          try {
            wx.showLoading({
              title: '清空中...'
            })

            const result = await wx.cloud.callFunction({
              name: 'uploadRainbowCards',
              data: {
                action: 'clear'
              }
            })

            wx.hideLoading()
            
                         const res = result.result as any
             self.addLog(`清空结果: ${JSON.stringify(res)}`)
             
             if (res?.success) {
               self.addLog('✅ 数据库清空成功！')
               
               wx.showToast({
                 title: '清空成功',
                 icon: 'success'
               })
             } else {
               throw new Error(res?.error || '清空失败')
             }

          } catch (error: any) {
            wx.hideLoading()
            self.addLog(`❌ 清空失败: ${error.message}`)
            
            console.error('清空失败:', error)
                         wx.showToast({
               title: '清空失败',
               icon: 'none'
             })
          }
        }
      }
    })
  },

  /**
   * 清空日志
   */
  clearLogs() {
    this.setData({ logs: [] })
    this.addLog('日志已清空')
  },

  /**
   * 复制日志
   */
  copyLogs() {
    const logs = this.data.logs.join('\n')
    wx.setClipboardData({
      data: logs,
      success: () => {
        wx.showToast({
          title: '日志已复制',
          icon: 'success'
        })
      }
    })
  }
}) 