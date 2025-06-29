# 过渡动画资源说明

## 当前状态
- 现有文件：`加载过渡动画.mp4`
- 需要文件：`加载过渡动画.gif`

## 转换方法

### 方法1：使用在线工具
1. 访问 https://convertio.co/mp4-gif/
2. 上传 `加载过渡动画.mp4` 文件
3. 设置GIF参数：
   - 帧率：10-15 FPS
   - 尺寸：建议保持原始尺寸
   - 循环：无限循环
4. 下载转换后的GIF文件
5. 重命名为 `加载过渡动画.gif`

### 方法2：使用FFmpeg（命令行）
```bash
ffmpeg -i 加载过渡动画.mp4 -vf "fps=15,scale=320:-1:flags=lanczos" -loop 0 加载过渡动画.gif
```

### 方法3：使用其他在线工具
- https://cloudconvert.com/mp4-to-gif
- https://www.online-convert.com/result#mp4-to-gif

## 注意事项
- GIF文件大小控制在2MB以内
- 建议帧率不超过15FPS
- 确保GIF可以循环播放
- 转换完成后将GIF文件放在当前目录下

## 代码已更新
过渡动画组件已经更新为使用GIF格式：
- 组件路径：`/components/loading-transition/`
- 资源路径：`/assets/加载过渡动画.gif`
- 播放时长：3秒（可在组件中调整） 