# colorpsychology 云函数测试指南

本文档提供了测试 `colorpsychology` 云函数不同功能的详细方法和示例。

## 功能概述

`colorpsychology` 云函数提供三种调用模式：

1. **分析颜色模式** (`analyzeColor`): 分析用户文本，确定心理状态颜色并返回详细颜色数据。
2. **生成肯定短语模式** (`generateAffirmation`): 基于已提供的颜色数据生成肯定短语。
3. **完整流程模式** (`complete` 或默认): 一次性完成文本分析、颜色确定和肯定短语生成。

## 测试环境准备

1. 确保已部署 `colorpsychology` 云函数到云环境
2. 确保已设置 `DASHSCOPE_API_KEY` 环境变量
3. 确保 `color_meach.json` 文件已正确放置在云函数目录中

## 测试方法

### 方式一：使用微信开发者工具云函数调试面板

1. 打开微信开发者工具
2. 选择项目并进入云函数面板
3. 右键点击 `colorpsychology` 函数，选择"云端调试"
4. 在输入框中粘贴以下 JSON 测试用例之一
5. 点击"运行"按钮查看结果

### 方式二：在小程序代码中调用

在小程序页面的 JS 文件中添加以下代码：

```javascript
// 分析颜色模式测试
testAnalyzeColor() {
  wx.cloud.callFunction({
    name: 'colorpsychology',
    data: {
      name: 'analyzeColor',
      text: "今天我心情不错，遇到了很多好事，感觉生活充满阳光"
    }
  }).then(res => {
    console.log('颜色分析结果:', res.result);
  }).catch(err => {
    console.error('调用失败:', err);
  });
},

// 生成肯定短语模式测试
testGenerateAffirmation(selectedColor) {
  wx.cloud.callFunction({
    name: 'colorpsychology',
    data: {
      name: 'generateAffirmation',
      selectedColor: selectedColor
    }
  }).then(res => {
    console.log('肯定短语生成结果:', res.result);
  }).catch(err => {
    console.error('调用失败:', err);
  });
},

// 完整流程模式测试
testComplete() {
  wx.cloud.callFunction({
    name: 'colorpsychology',
    data: {
      text: "今天感觉压力很大，工作不顺利，心情有点低落"
    }
  }).then(res => {
    console.log('完整流程结果:', res.result);
  }).catch(err => {
    console.error('调用失败:', err);
  });
},

// 两步流程测试用例
testTwoStepProcess() {
  wx.cloud.callFunction({
    name: 'colorpsychology',
    data: {
      name: 'analyzeColor',
      text: "今天我心情不错，遇到了很多好事，感觉生活充满阳光"
    }
  }).then(res => {
    console.log('步骤1 - 颜色分析结果:', res.result);
    
    if(res.result.success) {
      wx.cloud.callFunction({
        name: 'colorpsychology',
        data: {
          name: 'generateAffirmation',
          selectedColor: res.result.selectedColor
        }
      }).then(finalRes => {
        console.log('步骤2 - 最终结果:', finalRes.result);
      });
    }
  });
}
```

## 测试用例

### 1. 分析颜色模式 (`analyzeColor`)

```json
{
  "name": "analyzeColor",
  "text": "今天我心情不错，遇到了很多好事，感觉生活充满阳光"
}
```

**预期返回结果:**
```json
{
  "success": true,
  "baseColor": "黄",
  "selectedColor": {
    "name": "香草黄",
    "hex": "#FDF2DA",
    "name_en": "Vanilla Yellow",
    "category": "暖色系",
    "hue_range": [45, 55],
    "background": "#FDF2DA",
    "text": "#F16F33",
    "meaning": "温暖、活力与乐观"
  }
}
```

### 2. 生成肯定短语模式 (`generateAffirmation`)

```json
{
  "name": "generateAffirmation",
  "selectedColor": {
    "name": "香草黄",
    "hex": "#FDF2DA",
    "name_en": "Vanilla Yellow",
    "category": "暖色系",
    "hue_range": [45, 55],
    "background": "#FDF2DA",
    "text": "#F16F33",
    "meaning": "温暖、活力与乐观"
  }
}
```

**预期返回结果:**
```json
{
  "success": true,
  "baseColor": "黄",
  "selectedColor": {
    "name": "香草黄",
    "hex": "#FDF2DA",
    "name_en": "Vanilla Yellow", 
    "category": "暖色系",
    "hue_range": [45, 55],
    "background": "#FDF2DA",
    "text": "#F16F33",
    "meaning": "温暖、活力与乐观"
  },
  "affirmation": "阳光照耀，你的潜能正在觉醒"
}
```

### 3. 完整流程模式 (默认)

```json
{
  "text": "今天感觉压力很大，工作不顺利，心情有点低落"
}
```

**预期返回结果:**
```json
{
  "success": true,
  "baseColor": "蓝",
  "selectedColor": {
    "name": "静谧蓝",
    "hex": "#5468B6",
    "name_en": "Serene Blue",
    "category": "冷色系",
    "hue_range": [220, 240],
    "background": "#5468B6",
    "text": "#FDF2DA",
    "meaning": "宁静、智慧与沉稳"
  },
  "affirmation": "深呼吸，你的内心充满力量"
}
```

## 其他测试样例

### 不同情绪文本测试

1. 积极文本：
   - "今天很开心，一切都很顺利"
   - "刚刚完成了一项重要任务，感到很有成就感"

2. 消极文本：
   - "感觉很焦虑，不知道怎么解决这个问题"
   - "最近压力很大，睡不好觉"

3. 复杂情绪文本：
   - "既期待新工作，又担心能否胜任"
   - "虽然遇到了挫折，但我相信会好起来的"

## 注意事项

1. 颜色判断依赖于大语言模型的分析，相同文本可能会有不同结果
2. 肯定短语生成受模型随机性影响，即使相同颜色也可能产生不同短语
3. 大语言模型调用可能会有延迟，请耐心等待结果
4. 确保已正确设置 API Key 环境变量，否则调用会失败
