import csv
import json
import pandas as pd

def csv_to_json():
    """
    将修复后的CSV文件转换为JSON格式，供云函数使用
    """
    data = []
    
    # 读取修复后的CSV文件
    with open('fixed_data.csv', 'r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # 跳过标题行
        
        for row in csv_reader:
            if len(row) >= 4:  # 确保有足够的列
                card = {
                    "id": int(row[0]),
                    "content": row[1],
                    "color": row[2],
                    "translation": row[3]
                }
                data.append(card)
    
    # 生成JavaScript格式的数据文件
    js_content = "const HEALING_CARDS_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n\nmodule.exports = HEALING_CARDS_DATA;"
    
    with open('healing_cards_data.js', 'w', encoding='utf-8') as file:
        file.write(js_content)
    
    # 生成JSON文件
    with open('healing_cards_complete.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
    
    print(f"成功生成 {len(data)} 条记录的数据文件")
    
    # 统计各颜色数量
    color_stats = {}
    for card in data:
        color = card['color']
        color_stats[color] = color_stats.get(color, 0) + 1
    
    print("各颜色卡片数量:")
    for color, count in color_stats.items():
        print(f"  {color}: {count} 张")
    
    return data

if __name__ == "__main__":
    csv_to_json() 