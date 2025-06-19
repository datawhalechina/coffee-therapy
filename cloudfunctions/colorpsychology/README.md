# 心理状态颜色分析云函数

此云函数基于用户输入的文本，分析用户的心理状态并匹配对应的颜色，同时生成一个简短的行动肯定短语。

## 功能

1. 分析用户输入的文本，判断对应的心理状态
2. 将心理状态映射到七种基础颜色之一：红、橙、黄、绿、青、蓝、紫
3. 从颜色数据库中匹配具体的颜色值
4. 生成基于颜色特性的行动肯定短语

## 调用方式

```javascript
wx.cloud.callFunction({
  name: 'colorpsychology',
  data: {
    text: "用户输入的文本内容"
  }
}).then(res => {
  console.log(res.result);
})
```

## 返回数据

```javascript
{
  success: true,
  baseColor: "红", // 基础颜色
  selectedColor: {
    name: "玫红色",
    hex: "#E77793",
    name_en: "Rose Pink",
    category: "暖色系",
    meaning: "激情、热情与活力"
  },
  affirmation: "燃烧热情 Go!" // 行动肯定短语
}
```
