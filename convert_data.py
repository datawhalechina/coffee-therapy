#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
疗愈卡片数据转换器
将CSV数据转换为JSON格式，适用于小程序云函数
"""

import csv
import json
import os
import sys

# 示例CSV数据（如果找不到文件，可以使用这个示例数据）
SAMPLE_DATA = """序号,内容,所属颜色,对应翻译
1,富裕就是快乐和自由。,红色,Abundance is happiness and freedom.
2,我使自己的身、心、灵都很健康。,红色,I keep my body, mind, and spirit healthy.
3,身体是我亲密的朋友。,红色,My body is my intimate friend.
36,每天早晨我醒来，都喜悦地期待这一天会带给我的礼物。,橙色,Every morning I wake up, I joyfully anticipate the gifts this day will bring.
71,我很平安，而且一切都很顺利。,黄色,I am at peace, and everything is going smoothly.
107,我以爱的眼光来看我的伙伴。,绿色,I see my partner with eyes of love.
141,今天我的能量是发光且平和。我可以用建设性的方式来表达我的愤怒。,蓝色,Today my energy is radiant and peaceful. I can express my anger in constructive ways.
211,即使在工作中，我也准备好与更高的自我接触。,靛色,Even at work, I am ready to connect with my higher self."""

def create_sample_csv():
    """创建示例CSV文件"""
    with open('sample_data.csv', 'w', encoding='utf-8') as f:
        f.write(SAMPLE_DATA)
    print("✅ 已创建示例CSV文件：sample_data.csv")

def csv_to_json(csv_content=None, csv_file_path=None):
    """
    将CSV内容转换为JSON格式
    
    Args:
        csv_content (str): CSV内容字符串
        csv_file_path (str): CSV文件路径
    """
    
    cards_data = []
    color_groups = {}
    
    try:
        if csv_content:
            # 直接处理CSV内容
            lines = csv_content.strip().split('\n')
            reader = csv.DictReader(lines)
        elif csv_file_path and os.path.exists(csv_file_path):
            # 读取CSV文件
            with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                lines = list(reader)
                reader = iter(lines)
        else:
            print("❌ 没有提供有效的CSV数据或文件路径")
            return None
        
        for row in reader:
            # 构建卡片数据结构
            card_id = row['序号'].strip()
            content = row['内容'].strip()
            color = row['所属颜色'].strip()
            translation = row['对应翻译'].strip()
            
            card = {
                "id": int(card_id) if card_id.isdigit() else card_id,
                "content": content,
                "color": color,
                "translation": translation
            }
            
            cards_data.append(card)
            
            # 按颜色分组
            if color not in color_groups:
                color_groups[color] = []
            color_groups[color].append(card)
        
        # 构建适用于小程序的JSON结构
        output_data = {
            "metadata": {
                "title": "疗愈卡片数据库",
                "description": "职场心灵疗愈卡片，支持中英文双语",
                "total_cards": len(cards_data),
                "colors": list(color_groups.keys()),
                "color_counts": {color: len(cards) for color, cards in color_groups.items()},
                "created_at": "2024-12-27"
            },
            "cards": cards_data,
            "by_color": color_groups
        }
        
        return output_data
        
    except Exception as e:
        print(f"❌ 转换失败：{str(e)}")
        return None

def save_json_files(data):
    """保存JSON文件到不同格式"""
    if not data:
        return
    
    # 1. 完整数据文件
    with open('healing_cards_full.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("📁 已生成：healing_cards_full.json（完整数据）")
    
    # 2. 仅卡片数组（适用于小程序）
    with open('healing_cards_simple.json', 'w', encoding='utf-8') as f:
        json.dump(data['cards'], f, ensure_ascii=False, indent=2)
    print("📁 已生成：healing_cards_simple.json（简化版本）")
    
    # 3. 按颜色分组（适用于颜色选择功能）
    with open('healing_cards_by_color.json', 'w', encoding='utf-8') as f:
        json.dump(data['by_color'], f, ensure_ascii=False, indent=2)
    print("📁 已生成：healing_cards_by_color.json（按颜色分组）")
    
    # 4. 小程序云函数格式
    cloud_function_data = {
        "cards": data['cards'],
        "colors": list(data['by_color'].keys()),
        "total": len(data['cards'])
    }
    with open('cloud_function_data.json', 'w', encoding='utf-8') as f:
        json.dump(cloud_function_data, f, ensure_ascii=False, indent=2)
    print("📁 已生成：cloud_function_data.json（云函数专用）")

def print_statistics(data):
    """打印统计信息"""
    print("\n📊 数据统计：")
    print("=" * 50)
    print(f"总卡片数：{data['metadata']['total_cards']}")
    print(f"颜色类别：{len(data['metadata']['colors'])}")
    
    for color, count in data['metadata']['color_counts'].items():
        print(f"  {color}：{count}张")
    
    print("\n🔍 示例数据：")
    print("-" * 30)
    for color, cards in data['by_color'].items():
        print(f"\n【{color}】")
        example = cards[0] if cards else None
        if example:
            print(f"  {example['content']}")
            print(f"  {example['translation']}")

if __name__ == "__main__":
    print("🎨 疗愈卡片数据转换器")
    print("=" * 50)
    
    # 尝试不同的文件路径
    possible_paths = [
        r"c:\Users\pipi\Desktop\data.csv",
        "data.csv",
        "sample_data.csv"
    ]
    
    csv_file = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_file = path
            print(f"✅ 找到CSV文件：{path}")
            break
    
    if not csv_file:
        print("❌ 找不到CSV文件，使用示例数据")
        create_sample_csv()
        csv_file = "sample_data.csv"
    
    # 转换数据
    result = csv_to_json(csv_file_path=csv_file)
    
    if result:
        # 保存各种格式的JSON文件
        save_json_files(result)
        
        # 打印统计信息
        print_statistics(result)
        
        print(f"\n✅ 转换完成！生成了4个JSON文件供不同用途使用。")
    else:
        print("❌ 转换失败") 