import json

def extract_cards_data():
    """从healing_cards_fixed.json中提取卡片数据用于云函数"""
    
    # 读取完整数据
    with open('healing_cards_fixed.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    cards = data['cards']
    print(f"提取到 {len(cards)} 条卡片数据")
    
    # 输出前几条数据验证
    print("\n前5条数据:")
    for i, card in enumerate(cards[:5]):
        print(f"{i+1}. ID:{card['id']} - {card['content'][:30]}...")
    
    # 生成云函数用的JavaScript数组格式
    js_output = "const HEALING_CARDS_DATA = [\n"
    for i, card in enumerate(cards):
        js_output += "  {\n"
        js_output += f'    "id": {card["id"]},\n'
        js_output += f'    "content": {json.dumps(card["content"], ensure_ascii=False)},\n'
        js_output += f'    "color": {json.dumps(card["color"], ensure_ascii=False)},\n'
        js_output += f'    "translation": {json.dumps(card["translation"], ensure_ascii=False)}\n'
        js_output += "  }"
        if i < len(cards) - 1:
            js_output += ","
        js_output += "\n"
    js_output += "];\n"
    
    # 保存到文件
    with open('cards_data_for_cloud_function.js', 'w', encoding='utf-8') as file:
        file.write(js_output)
    
    print(f"\n已生成云函数数据文件: cards_data_for_cloud_function.js")
    
    # 统计各颜色数量
    color_stats = {}
    for card in cards:
        color = card['color']
        color_stats[color] = color_stats.get(color, 0) + 1
    
    print("\n各颜色卡片统计:")
    for color, count in color_stats.items():
        print(f"  {color}: {count} 张")
    
    return cards

if __name__ == "__main__":
    extract_cards_data() 