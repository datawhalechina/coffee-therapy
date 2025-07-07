#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV转JSON Lines格式转换器
专门处理导入系统要求的JSON Lines格式
"""

import csv
import json
import os
from io import StringIO

def parse_csv_with_commas(csv_content):
    """
    解析包含逗号的CSV内容
    
    Args:
        csv_content (str): CSV内容字符串
    """
    lines = csv_content.strip().split('\n')
    cards_data = []
    
    # 处理表头
    header = lines[0].split(',')
    print(f"表头：{header}")
    
    # 处理数据行
    for i, line in enumerate(lines[1:], 1):
        if not line.strip():
            continue
            
        # 手动解析策略：从已知的颜色位置分割
        colors = ['红色', '橙色', '黄色', '绿色', '蓝色', '靛色', '紫色']
        
        # 找到颜色字段的位置
        color_found = None
        color_pos = -1
        
        for color in colors:
            # 查找 ",颜色," 的模式
            pattern = f',{color},'
            pos = line.find(pattern)
            if pos != -1:
                color_found = color
                color_pos = pos
                break
        
        if color_found and color_pos > 0:
            # 分割数据
            before_color = line[:color_pos]
            after_color = line[color_pos + len(color_found) + 2:]  # +2 for the commas
            
            # 从前半部分提取序号和内容
            comma_pos = before_color.find(',')
            if comma_pos > 0:
                序号 = before_color[:comma_pos].strip()
                内容 = before_color[comma_pos + 1:].strip()
                翻译 = after_color.strip()
                
                # 构建卡片对象
                card = {
                    "id": int(序号) if 序号.isdigit() else 序号,
                    "content": 内容,
                    "color": color_found,
                    "translation": 翻译
                }
                
                cards_data.append(card)
                print(f"✅ 第{i}行解析成功：{序号} - {color_found}")
            else:
                print(f"⚠️  第{i}行无法找到序号分隔符")
        else:
            print(f"⚠️  第{i}行找不到颜色标识：{line[:100]}...")
    
    print(f"\n总共解析了 {len(cards_data)} 条记录")
    return cards_data

def create_jsonl_file(cards_data, output_file="healing_cards.jsonl"):
    """
    创建JSON Lines格式文件
    
    Args:
        cards_data (list): 卡片数据列表
        output_file (str): 输出文件名
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for card in cards_data:
                # 每行写入一个JSON对象
                json_line = json.dumps(card, ensure_ascii=False)
                f.write(json_line + '\n')
        
        print(f"✅ JSON Lines文件已生成：{output_file}")
        print(f"📊 共 {len(cards_data)} 行记录")
        return output_file
        
    except Exception as e:
        print(f"❌ 生成JSON Lines文件失败：{str(e)}")
        return None

def create_multiple_formats(cards_data):
    """
    创建多种导入格式
    
    Args:
        cards_data (list): 卡片数据列表
    """
    
    # 1. 标准JSON Lines格式
    create_jsonl_file(cards_data, "healing_cards.jsonl")
    
    # 2. 带元数据的JSON Lines格式
    with open("healing_cards_with_meta.jsonl", 'w', encoding='utf-8') as f:
        for card in cards_data:
            enhanced_card = {
                **card,
                "type": "healing_card",
                "language": "zh-CN",
                "category": "workplace_healing"
            }
            json_line = json.dumps(enhanced_card, ensure_ascii=False)
            f.write(json_line + '\n')
    
    # 3. 简化版JSON Lines（仅内容和翻译）
    with open("healing_cards_simple.jsonl", 'w', encoding='utf-8') as f:
        for card in cards_data:
            simple_card = {
                "content": card["content"],
                "translation": card["translation"]
            }
            json_line = json.dumps(simple_card, ensure_ascii=False)
            f.write(json_line + '\n')
    
    # 4. 按颜色分组的JSON Lines
    color_groups = {}
    for card in cards_data:
        color = card['color']
        if color not in color_groups:
            color_groups[color] = []
        color_groups[color].append(card)
    
    for color, cards in color_groups.items():
        filename = f"healing_cards_{color}.jsonl"
        create_jsonl_file(cards, filename)
    
    print(f"\n📁 已生成多种格式文件：")
    print(f"   - healing_cards.jsonl（标准格式）")
    print(f"   - healing_cards_with_meta.jsonl（带元数据）")
    print(f"   - healing_cards_simple.jsonl（简化版）")
    for color in color_groups.keys():
        print(f"   - healing_cards_{color}.jsonl（{color}卡片）")

def validate_jsonl_file(file_path):
    """
    验证JSON Lines文件格式
    
    Args:
        file_path (str): JSON Lines文件路径
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        valid_count = 0
        errors = []
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                json.loads(line)
                valid_count += 1
            except json.JSONDecodeError as e:
                errors.append(f"第{i}行格式错误：{str(e)}")
        
        print(f"\n🔍 JSON Lines文件验证结果：")
        print(f"   - 文件：{file_path}")
        print(f"   - 总行数：{len(lines)}")
        print(f"   - 有效行数：{valid_count}")
        
        if errors:
            print(f"   - 错误数：{len(errors)}")
            for error in errors[:5]:  # 只显示前5个错误
                print(f"     {error}")
            if len(errors) > 5:
                print(f"     ... 还有{len(errors) - 5}个错误")
        else:
            print(f"   ✅ 格式验证通过！")
        
        return len(errors) == 0
        
    except Exception as e:
        print(f"❌ 验证失败：{str(e)}")
        return False

# 示例CSV数据（包含逗号问题的数据）
SAMPLE_CSV_DATA = """序号,内容,所属颜色,对应翻译
1,富裕就是快乐和自由。,红色,Abundance is happiness and freedom.
2,我使自己的身、心、灵都很健康。,红色,I keep my body, mind, and spirit healthy.
141,今天我的能量是发光且平和。我可以用建设性的方式来表达我的愤怒。,蓝色,Today my energy is radiant and peaceful. I can express my anger in constructive ways.
142,在人际关系中，我能在亲密和自由之间取得平衡。,蓝色,In relationships, I balance intimacy and freedom.
51,当下每件事物都是活力充沛的。(那天玩着抽到了这个，可能是对我的提醒吧，活力一点，不要死气沉沉，暮气横秋的，好好调整自己吧。),橙色,Everything is vibrant at this moment. (That day I drew this card, it might be a reminder to myself: be more lively, don't be lifeless or old-fashioned, adjust yourself properly.)"""

if __name__ == "__main__":
    print("🔄 CSV转JSON Lines格式转换器")
    print("=" * 60)
    
    # 查找CSV文件
    possible_files = [
        r"c:\Users\pipi\Desktop\data.csv",
        "test_data.csv",
        "data.csv"
    ]
    
    csv_file = None
    for file_path in possible_files:
        if os.path.exists(file_path):
            csv_file = file_path
            print(f"✅ 找到CSV文件：{file_path}")
            break
    
    # 读取CSV数据
    if csv_file:
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                csv_content = f.read()
            print(f"📁 从文件读取数据：{csv_file}")
        except Exception as e:
            print(f"⚠️  读取文件失败：{str(e)}")
            print("使用示例数据...")
            csv_content = SAMPLE_CSV_DATA
    else:
        print("⚠️  未找到CSV文件，使用示例数据")
        csv_content = SAMPLE_CSV_DATA
        
        # 创建示例文件
        with open("sample_data.csv", 'w', encoding='utf-8') as f:
            f.write(csv_content)
        print("📝 已创建示例文件：sample_data.csv")
    
    # 解析CSV数据
    print(f"\n📖 解析CSV数据...")
    cards_data = parse_csv_with_commas(csv_content)
    
    if cards_data:
        # 创建多种格式
        print(f"\n📝 生成JSON Lines格式...")
        create_multiple_formats(cards_data)
        
        # 验证生成的文件
        print(f"\n🔍 验证生成的文件...")
        validate_jsonl_file("healing_cards.jsonl")
        
        # 显示示例内容
        print(f"\n📋 示例JSON Lines内容：")
        print("-" * 40)
        for i, card in enumerate(cards_data[:3]):
            print(json.dumps(card, ensure_ascii=False))
            
        if len(cards_data) > 3:
            print(f"... 还有 {len(cards_data) - 3} 行")
            
        print(f"\n✅ 转换完成！现在可以使用 healing_cards.jsonl 文件进行导入。")
        
    else:
        print("❌ 无法解析CSV数据") 