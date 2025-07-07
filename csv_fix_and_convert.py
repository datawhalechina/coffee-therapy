#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSV修复和转换器
专门处理包含逗号的英文翻译字段
"""

import csv
import json
import re
import os

def fix_csv_commas(input_file, output_file=None):
    """
    修复CSV文件中包含逗号但没有引号的字段
    
    Args:
        input_file (str): 输入CSV文件路径
        output_file (str): 输出修复后的CSV文件路径
    """
    if output_file is None:
        output_file = "fixed_" + os.path.basename(input_file)
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            lines = infile.readlines()
        
        fixed_lines = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if i == 0:  # 表头行
                fixed_lines.append(line)
                continue
            
            # 使用正则表达式来正确分割包含逗号的字段
            # 策略：从右向左分割，因为我们知道结构是：序号,内容,颜色,翻译
            parts = line.split(',')
            
            if len(parts) > 4:
                # 说明翻译字段中包含逗号，需要合并
                序号 = parts[0]
                颜色 = parts[-2]  # 倒数第二个是颜色
                翻译_parts = parts[-1:]  # 最后一个开始是翻译的一部分
                
                # 找到颜色字段的位置，然后合并翻译部分
                # 从后往前合并，直到找到合理的中文内容
                for j in range(len(parts) - 3, 0, -1):
                    if parts[j] in ['红色', '橙色', '黄色', '绿色', '蓝色', '靛色', '紫色']:
                        颜色 = parts[j]
                        内容 = ','.join(parts[1:j])
                        翻译 = ','.join(parts[j+1:])
                        break
                else:
                    # 如果没找到标准颜色，使用默认分割
                    内容 = ','.join(parts[1:-2])
                    翻译 = parts[-1]
                
                # 重新组装，给包含逗号的字段加引号
                fixed_line = f'{序号},"{内容}",{颜色},"{翻译}"'
                fixed_lines.append(fixed_line)
            else:
                # 如果字段数正确，检查是否需要加引号
                if len(parts) == 4:
                    序号, 内容, 颜色, 翻译 = parts
                    # 给可能包含逗号的字段加引号
                    if ',' in 内容 or '，' in 内容:
                        内容 = f'"{内容}"'
                    if ',' in 翻译:
                        翻译 = f'"{翻译}"'
                    fixed_line = f'{序号},{内容},{颜色},{翻译}'
                    fixed_lines.append(fixed_line)
                else:
                    fixed_lines.append(line)
        
        # 写入修复后的文件
        with open(output_file, 'w', encoding='utf-8') as outfile:
            for line in fixed_lines:
                outfile.write(line + '\n')
        
        print(f"✅ CSV文件已修复并保存为：{output_file}")
        return output_file
        
    except Exception as e:
        print(f"❌ 修复CSV文件失败：{str(e)}")
        return None

def robust_csv_parse(file_path):
    """
    健壮的CSV解析，能处理各种格式问题
    
    Args:
        file_path (str): CSV文件路径
    """
    cards_data = []
    
    try:
        # 方法1：尝试标准CSV解析
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            # 先尝试自动检测方言
            sample = csvfile.read(1024)
            csvfile.seek(0)
            sniffer = csv.Sniffer()
            
            try:
                dialect = sniffer.sniff(sample)
                reader = csv.DictReader(csvfile, dialect=dialect)
            except:
                # 如果自动检测失败，使用默认设置
                csvfile.seek(0)
                reader = csv.DictReader(csvfile, quoting=csv.QUOTE_MINIMAL)
            
            for row_num, row in enumerate(reader, 1):
                try:
                    card = {
                        "id": int(row['序号']) if row['序号'].isdigit() else row['序号'],
                        "content": row['内容'].strip().strip('"'),
                        "color": row['所属颜色'].strip(),
                        "translation": row['对应翻译'].strip().strip('"')
                    }
                    cards_data.append(card)
                except Exception as e:
                    print(f"⚠️  第{row_num}行解析出现问题：{str(e)}")
                    print(f"   原始数据：{row}")
                    continue
        
        print(f"✅ 成功解析 {len(cards_data)} 条记录")
        return cards_data
        
    except Exception as e:
        print(f"❌ CSV解析失败：{str(e)}")
        return None

def manual_csv_parse(file_path):
    """
    手动CSV解析，适用于格式特殊的情况
    
    Args:
        file_path (str): CSV文件路径
    """
    cards_data = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # 跳过表头
        for i, line in enumerate(lines[1:], 1):
            line = line.strip()
            if not line:
                continue
            
            # 手动解析策略：从已知的颜色位置向前后分割
            colors = ['红色', '橙色', '黄色', '绿色', '蓝色', '靛色', '紫色']
            
            # 找到颜色在字符串中的位置
            color_pos = -1
            color_found = None
            for color in colors:
                pos = line.rfind(',' + color + ',')
                if pos > color_pos:
                    color_pos = pos
                    color_found = color
            
            if color_found and color_pos > 0:
                # 分割数据
                before_color = line[:color_pos]
                after_color = line[color_pos + len(color_found) + 2:]  # +2 for the commas
                
                # 再次分割前半部分得到序号和内容
                序号_end = before_color.find(',')
                if 序号_end > 0:
                    序号 = before_color[:序号_end]
                    内容 = before_color[序号_end + 1:]
                    
                    card = {
                        "id": int(序号) if 序号.isdigit() else 序号,
                        "content": 内容.strip().strip('"'),
                        "color": color_found,
                        "translation": after_color.strip().strip('"')
                    }
                    cards_data.append(card)
                else:
                    print(f"⚠️  第{i}行格式异常，跳过")
            else:
                print(f"⚠️  第{i}行找不到颜色标识，跳过")
        
        print(f"✅ 手动解析成功 {len(cards_data)} 条记录")
        return cards_data
        
    except Exception as e:
        print(f"❌ 手动解析失败：{str(e)}")
        return None

def convert_to_json(cards_data):
    """
    将卡片数据转换为JSON格式
    
    Args:
        cards_data (list): 卡片数据列表
    """
    if not cards_data:
        return None
    
    # 按颜色分组
    color_groups = {}
    for card in cards_data:
        color = card['color']
        if color not in color_groups:
            color_groups[color] = []
        color_groups[color].append(card)
    
    # 构建完整数据结构
    result = {
        "metadata": {
            "title": "疗愈卡片数据库",
            "description": "职场心灵疗愈卡片，支持中英文双语（修复版）",
            "total_cards": len(cards_data),
            "colors": list(color_groups.keys()),
            "color_counts": {color: len(cards) for color, cards in color_groups.items()},
            "created_at": "2024-12-27"
        },
        "cards": cards_data,
        "by_color": color_groups
    }
    
    return result

def validate_data(cards_data):
    """
    验证数据完整性
    
    Args:
        cards_data (list): 卡片数据列表
    """
    print("\n🔍 数据验证：")
    print("=" * 50)
    
    issues = []
    
    for i, card in enumerate(cards_data):
        # 检查必要字段
        if not card.get('content'):
            issues.append(f"第{i+1}条记录缺少内容")
        if not card.get('translation'):
            issues.append(f"第{i+1}条记录缺少翻译")
        if not card.get('color'):
            issues.append(f"第{i+1}条记录缺少颜色")
        
        # 检查翻译是否完整（简单检查是否以句号结尾）
        translation = card.get('translation', '')
        if translation and not translation.rstrip().endswith('.'):
            issues.append(f"第{i+1}条记录翻译可能不完整：{translation[:50]}...")
    
    if issues:
        print(f"⚠️  发现 {len(issues)} 个问题：")
        for issue in issues[:10]:  # 只显示前10个问题
            print(f"   - {issue}")
        if len(issues) > 10:
            print(f"   ... 还有 {len(issues) - 10} 个问题")
    else:
        print("✅ 数据验证通过，没有发现问题")
    
    return len(issues) == 0

if __name__ == "__main__":
    print("🔧 CSV修复和转换器")
    print("=" * 50)
    
    # 文件路径
    possible_files = [
        r"c:\Users\pipi\Desktop\data.csv",
        "test_data.csv",
        "data.csv"
    ]
    
    csv_file = None
    for file_path in possible_files:
        if os.path.exists(file_path):
            csv_file = file_path
            break
    
    if not csv_file or not os.path.exists(csv_file):
        print(f"❌ 找不到文件：{csv_file if csv_file else '任何指定文件'}")
        print("请确认文件路径是否正确")
        exit(1)
    
    print(f"📁 处理文件：{csv_file}")
    
    # 方法1：先修复CSV格式
    print("\n🔧 步骤1：修复CSV格式")
    fixed_file = fix_csv_commas(csv_file)
    
    # 方法2：健壮解析
    print("\n📖 步骤2：解析CSV数据")
    if fixed_file:
        cards_data = robust_csv_parse(fixed_file)
    else:
        cards_data = robust_csv_parse(csv_file)
    
    # 如果标准解析失败，尝试手动解析
    if not cards_data or len(cards_data) < 10:
        print("\n🔄 标准解析结果不理想，尝试手动解析...")
        cards_data = manual_csv_parse(csv_file)
    
    if cards_data:
        # 数据验证
        validate_data(cards_data)
        
        # 转换为JSON
        print("\n📝 步骤3：转换为JSON格式")
        json_data = convert_to_json(cards_data)
        
        if json_data:
            # 保存文件
            with open('healing_cards_fixed.json', 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            with open('healing_cards_simple_fixed.json', 'w', encoding='utf-8') as f:
                json.dump(cards_data, f, ensure_ascii=False, indent=2)
            
            print("✅ 转换完成！")
            print("📁 已生成：")
            print("   - healing_cards_fixed.json（完整数据）")
            print("   - healing_cards_simple_fixed.json（简化数据）")
            
            # 显示统计信息
            print(f"\n📊 最终统计：")
            print(f"   - 总卡片数：{len(cards_data)}")
            for color, count in json_data['metadata']['color_counts'].items():
                print(f"   - {color}：{count}张")
        else:
            print("❌ JSON转换失败")
    else:
        print("❌ 无法解析CSV数据") 