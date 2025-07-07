import json

def create_cloud_function_data():
    """从healing_cards_fixed.json提取卡片数据，生成云函数用的JSON文件"""
    
    # 读取完整数据
    with open('healing_cards_fixed.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # 提取卡片数据
    cards = data['cards']
    print(f"提取到 {len(cards)} 条卡片数据")
    
    # 保存到云函数目录
    output_path = 'cloudfunctions/uploadRainbowCards/healing_cards_data.json'
    with open(output_path, 'w', encoding='utf-8') as file:
        json.dump(cards, file, ensure_ascii=False, indent=2)
    
    print(f"已生成云函数数据文件: {output_path}")
    
    # 验证数据
    print("\n数据验证:")
    print(f"总计: {len(cards)} 条记录")
    
    # 统计各颜色数量
    color_stats = {}
    for card in cards:
        color = card['color']
        color_stats[color] = color_stats.get(color, 0) + 1
    
    print("\n各颜色卡片统计:")
    for color, count in color_stats.items():
        print(f"  {color}: {count} 张")
    
    # 显示前几条数据样例
    print("\n前3条数据样例:")
    for i, card in enumerate(cards[:3]):
        print(f"  {i+1}. ID:{card['id']} - {card['content'][:25]}... [{card['color']}]")
    
    return cards

if __name__ == "__main__":
    create_cloud_function_data() 