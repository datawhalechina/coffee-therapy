#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV转JSON转换器
将疗愈卡片数据从CSV格式转换为JSON格式
"""

import csv
import json
import os
from collections import defaultdict

def csv_to_json(csv_file_path, output_file_path=None):
    """
    将CSV文件转换为JSON格式
    
    Args:
        csv_file_path (str): CSV文件路径
        output_file_path (str): 输出JSON文件路径，如果为None则使用默认名称
    """
    
    if output_file_path is None:
        # 使用CSV文件名生成JSON文件名
        base_name = os.path.splitext(os.path.basename(csv_file_path))[0]
        output_file_path = f"{base_name}.json"
    
    # 读取CSV数据
    cards_data = []
    color_groups = defaultdict(list)
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            # 使用DictReader自动处理表头
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # 构建卡片数据结构
                card = {
                    "id": int(row['序号']) if row['序号'].isdigit() else row['序号'],
                    "content": row['内容'].strip(),
                    "color": row['所属颜色'].strip(),
                    "translation": row['对应翻译'].strip()
                }
                
                cards_data.append(card)
                
                # 按颜色分组
                color_groups[card['color']].append(card)
        
        # 构建最终的JSON结构
        output_data = {
            "metadata": {
                "title": "疗愈卡片数据库",
                "description": "包含不同颜色主题的疗愈语句及其英文翻译",
                "total_cards": len(cards_data),
                "colors": list(color_groups.keys()),
                "color_counts": {color: len(cards) for color, cards in color_groups.items()}
            },
            "cards": cards_data,
            "by_color": dict(color_groups)
        }
        
        # 写入JSON文件
        with open(output_file_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(output_data, jsonfile, ensure_ascii=False, indent=2)
        
        print(f"✅ 成功转换！")
        print(f"📊 统计信息：")
        print(f"   - 总卡片数：{len(cards_data)}")
        print(f"   - 颜色类别：{len(color_groups)}")
        for color, count in output_data['metadata']['color_counts'].items():
            print(f"   - {color}：{count}张")
        print(f"📁 输出文件：{output_file_path}")
        
        return output_data
        
    except FileNotFoundError:
        print(f"❌ 错误：找不到文件 {csv_file_path}")
        return None
    except UnicodeDecodeError:
        print(f"❌ 错误：文件编码问题，请确保CSV文件是UTF-8编码")
        return None
    except Exception as e:
        print(f"❌ 转换失败：{str(e)}")
        return None

def preview_data(json_data, limit=3):
    """
    预览转换后的数据
    
    Args:
        json_data (dict): JSON数据
        limit (int): 每个颜色预览的卡片数量
    """
    if not json_data:
        return
    
    print("\n🔍 数据预览：")
    print("=" * 50)
    
    for color, cards in json_data['by_color'].items():
        print(f"\n【{color}】({len(cards)}张)")
        for i, card in enumerate(cards[:limit]):
            print(f"  {card['id']:3d}. {card['content']}")
            print(f"       {card['translation']}")
        
        if len(cards) > limit:
            print(f"       ... 还有{len(cards) - limit}张卡片")

if __name__ == "__main__":
    # 默认CSV文件路径
    csv_file = r"c:\Users\pipi\Desktop\data.csv"
    
    # 检查文件是否存在
    if not os.path.exists(csv_file):
        print(f"❌ 文件不存在：{csv_file}")
        print("请确认CSV文件路径是否正确")
        exit(1)
    
    # 执行转换
    result = csv_to_json(csv_file)
    
    # 预览数据
    if result:
        preview_data(result)
        
        # 生成简化版本（仅包含卡片数据）
        simple_output = "data_simple.json"
        with open(simple_output, 'w', encoding='utf-8') as f:
            json.dump(result['cards'], f, ensure_ascii=False, indent=2)
        print(f"\n📁 同时生成简化版本：{simple_output}") 