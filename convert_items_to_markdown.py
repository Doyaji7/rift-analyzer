import json
import os
import sys

def convert_items_to_markdown(item_data, language='en_US'):
    """
    Convert League of Legends item JSON data to markdown format
    optimized for gameplay knowledge base
    """
    md = []
    
    # Header with language support
    if language == 'ko_KR':
        md.append("# 리그 오브 레전드 아이템\n\n")
    else:
        md.append("# League of Legends Items\n\n")
    
    # Process each item
    for item_id, item in item_data['data'].items():
        # Skip items that are not purchasable or hidden
        if not item.get('gold', {}).get('purchasable', False) or item.get('hideFromAll', False):
            continue
            
        md.append(f"## {item['name']}\n")
        
        if language == 'ko_KR':
            md.append(f"**아이템 ID:** {item_id}\n")
        else:
            md.append(f"**Item ID:** {item_id}\n")
        
        # Cost information
        gold = item.get('gold', {})
        if gold.get('total', 0) > 0:
            if language == 'ko_KR':
                md.append(f"**가격:** {gold['total']} 골드")
                if gold.get('base', 0) != gold.get('total', 0):
                    md.append(f" (기본: {gold['base']} 골드)")
                md.append(f"\n**판매가:** {gold.get('sell', 0)} 골드\n")
            else:
                md.append(f"**Cost:** {gold['total']} gold")
                if gold.get('base', 0) != gold.get('total', 0):
                    md.append(f" (Base: {gold['base']} gold)")
                md.append(f"\n**Sell Value:** {gold.get('sell', 0)} gold\n")
        
        # Description and plaintext
        if item.get('plaintext'):
            if language == 'ko_KR':
                md.append(f"**요약:** {item['plaintext']}\n")
            else:
                md.append(f"**Summary:** {item['plaintext']}\n")
        
        # Stats
        stats = item.get('stats', {})
        if stats:
            if language == 'ko_KR':
                md.append("**능력치:**\n")
                stat_names = {
                    'FlatHPPoolMod': '체력',
                    'FlatMPPoolMod': '마나', 
                    'FlatArmorMod': '방어력',
                    'FlatSpellBlockMod': '마법 저항력',
                    'FlatPhysicalDamageMod': '공격력',
                    'FlatMagicDamageMod': '주문력',
                    'PercentAttackSpeedMod': '공격 속도',
                    'FlatMovementSpeedMod': '이동 속도',
                    'FlatCritChanceMod': '치명타 확률',
                    'PercentLifeStealMod': '생명력 흡수',
                    'FlatHPRegenMod': '체력 재생',
                    'PercentMovementSpeedMod': '이동 속도'
                }
            else:
                md.append("**Stats:**\n")
                stat_names = {
                    'FlatHPPoolMod': 'Health',
                    'FlatMPPoolMod': 'Mana', 
                    'FlatArmorMod': 'Armor',
                    'FlatSpellBlockMod': 'Magic Resist',
                    'FlatPhysicalDamageMod': 'Attack Damage',
                    'FlatMagicDamageMod': 'Ability Power',
                    'PercentAttackSpeedMod': 'Attack Speed',
                    'FlatMovementSpeedMod': 'Movement Speed',
                    'FlatCritChanceMod': 'Critical Strike Chance',
                    'PercentLifeStealMod': 'Life Steal',
                    'FlatHPRegenMod': 'Health Regeneration',
                    'PercentMovementSpeedMod': 'Movement Speed'
                }
            
            for stat_key, value in stats.items():
                if value != 0 and stat_key in stat_names:
                    stat_name = stat_names[stat_key]
                    if 'Percent' in stat_key:
                        md.append(f"- +{value*100:.0f}% {stat_name}\n")
                    else:
                        md.append(f"- +{value} {stat_name}\n")
        
        # Item tags (categories)
        if item.get('tags'):
            if language == 'ko_KR':
                md.append(f"**카테고리:** {', '.join(item['tags'])}\n")
            else:
                md.append(f"**Categories:** {', '.join(item['tags'])}\n")
        
        # Build path
        if item.get('from'):
            if language == 'ko_KR':
                md.append(f"**조합 재료:** {', '.join(item['from'])}\n")
            else:
                md.append(f"**Builds From:** {', '.join(item['from'])}\n")
        if item.get('into'):
            if language == 'ko_KR':
                md.append(f"**상위 아이템:** {', '.join(item['into'])}\n")
            else:
                md.append(f"**Builds Into:** {', '.join(item['into'])}\n")
        
        # Description (passive/active effects)
        if item.get('description'):
            # Clean up HTML tags for better readability
            desc = item['description'].replace('<br>', '\n').replace('<br/>', '\n')
            desc = desc.replace('<stats>', '').replace('</stats>', '')
            desc = desc.replace('<unique>', '').replace('</unique>', '')
            
            if language == 'ko_KR':
                desc = desc.replace('<passive>', '패시브: ').replace('</passive>', '')
                desc = desc.replace('<active>', '액티브: ').replace('</active>', '')
            else:
                desc = desc.replace('<passive>', 'Passive: ').replace('</passive>', '')
                desc = desc.replace('<active>', 'Active: ').replace('</active>', '')
            
            # Remove other HTML tags
            import re
            desc = re.sub(r'<[^>]+>', '', desc)
            
            if language == 'ko_KR':
                md.append(f"**효과:** {desc}\n")
            else:
                md.append(f"**Effects:** {desc}\n")
        
        md.append("\n---\n\n")
    
    return ''.join(md)

def get_available_versions():
    """Get all available patch versions from the directory structure"""
    versions = []
    for item in os.listdir('.'):
        if os.path.isdir(item) and item.count('.') == 2:  # Format like 15.21.1
            try:
                # Validate version format
                parts = item.split('.')
                if len(parts) == 3 and all(part.isdigit() for part in parts):
                    versions.append(item)
            except:
                continue
    return sorted(versions, reverse=True)  # Latest version first

def main(version=None, language='en_US'):
    # If no version specified, use the latest available version
    if not version:
        available_versions = get_available_versions()
        if not available_versions:
            print("Error: No patch version directories found")
            return
        version = available_versions[0]
        print(f"Using latest version: {version}")
    
    input_file = f"{version}/data/{language}/item.json"
    
    # Set output file based on version and language
    if language == 'ko_KR':
        output_file = f"gameplay_knowledge_base/{version}/items_ko.md"
    else:
        output_file = f"gameplay_knowledge_base/{version}/items.md"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist")
        return
    
    # Read item data
    with open(input_file, 'r', encoding='utf-8') as f:
        item_data = json.load(f)
    
    # Convert to markdown
    markdown_content = convert_items_to_markdown(item_data, language)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Items converted to: {output_file}")

if __name__ == "__main__":
    # Allow version and language parameters from command line
    version = sys.argv[1] if len(sys.argv) > 1 else None
    language = sys.argv[2] if len(sys.argv) > 2 else 'en_US'
    main(version, language)