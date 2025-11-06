import json
import os
import sys
from pathlib import Path

def clean_html_tags(text):
    """Clean HTML tags and convert to markdown formatting"""
    import re
    if not text:
        return text
    
    # Convert common HTML tags to markdown
    text = text.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')
    text = text.replace('<b>', '**').replace('</b>', '**')
    text = text.replace('<i>', '*').replace('</i>', '*')
    
    # Remove font color tags but keep the content
    text = re.sub(r'<font[^>]*>', '', text)
    text = text.replace('</font>', '')
    
    # Remove other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    return text

def convert_champion_to_markdown(champion_data, language='en_US'):
    """
    Convert League of Legends champion JSON data to markdown format
    optimized for semantic search in Bedrock Knowledge Base
    """
    champion = list(champion_data['data'].values())[0]
    
    md = []
    
    # Header with champion name and title
    md.append(f"# {champion['name']} - {champion['title']}\n")
    
    # Basic Information with language support
    if language == 'ko_KR':
        md.append(f"**챔피언 ID:** {champion['id']}\n")
        md.append(f"**주 역할:** {', '.join(champion['tags'])}\n")
        md.append(f"**자원 유형:** {champion['partype']}\n\n")
    else:
        md.append(f"**Champion ID:** {champion['id']}\n")
        md.append(f"**Primary Role:** {', '.join(champion['tags'])}\n")
        md.append(f"**Resource Type:** {champion['partype']}\n\n")
    
    # Skip lore for gameplay-focused system
    
    # Difficulty and Stats Overview
    info = champion['info']
    if language == 'ko_KR':
        md.append("## 챔피언 난이도 및 플레이 스타일\n")
        md.append(f"- **전체 난이도:** {info['difficulty']}/10\n")
        md.append(f"- **공격력 등급:** {info['attack']}/10\n")
        md.append(f"- **방어력 등급:** {info['defense']}/10\n")
        md.append(f"- **마법력 등급:** {info['magic']}/10\n\n")
    else:
        md.append("## Champion Difficulty and Playstyle\n")
        md.append(f"- **Overall Difficulty:** {info['difficulty']}/10\n")
        md.append(f"- **Attack Rating:** {info['attack']}/10\n")
        md.append(f"- **Defense Rating:** {info['defense']}/10\n")
        md.append(f"- **Magic Rating:** {info['magic']}/10\n\n")
    
    # Base Statistics
    stats = champion['stats']
    if language == 'ko_KR':
        md.append("## 기본 능력치 (1레벨)\n")
        md.append(f"- **체력:** {stats['hp']} (레벨당 +{stats['hpperlevel']})\n")
        md.append(f"- **마나:** {stats['mp']} (레벨당 +{stats['mpperlevel']})\n")
        md.append(f"- **이동 속도:** {stats['movespeed']}\n")
        md.append(f"- **방어력:** {stats['armor']} (레벨당 +{stats['armorperlevel']})\n")
        md.append(f"- **마법 저항력:** {stats['spellblock']} (레벨당 +{stats['spellblockperlevel']})\n")
        md.append(f"- **공격력:** {stats['attackdamage']} (레벨당 +{stats['attackdamageperlevel']})\n")
        md.append(f"- **공격 속도:** {stats['attackspeed']} (레벨당 +{stats['attackspeedperlevel']}%)\n")
        md.append(f"- **공격 사거리:** {stats['attackrange']}\n")
        md.append(f"- **체력 재생:** {stats['hpregen']} (레벨당 +{stats['hpregenperlevel']})\n")
        md.append(f"- **마나 재생:** {stats['mpregen']} (레벨당 +{stats['mpregenperlevel']})\n\n")
    else:
        md.append("## Base Statistics (Level 1)\n")
        md.append(f"- **Health (HP):** {stats['hp']} (+{stats['hpperlevel']} per level)\n")
        md.append(f"- **Mana:** {stats['mp']} (+{stats['mpperlevel']} per level)\n")
        md.append(f"- **Movement Speed:** {stats['movespeed']}\n")
        md.append(f"- **Armor:** {stats['armor']} (+{stats['armorperlevel']} per level)\n")
        md.append(f"- **Magic Resist:** {stats['spellblock']} (+{stats['spellblockperlevel']} per level)\n")
        md.append(f"- **Attack Damage:** {stats['attackdamage']} (+{stats['attackdamageperlevel']} per level)\n")
        md.append(f"- **Attack Speed:** {stats['attackspeed']} (+{stats['attackspeedperlevel']}% per level)\n")
        md.append(f"- **Attack Range:** {stats['attackrange']}\n")
        md.append(f"- **HP Regeneration:** {stats['hpregen']} (+{stats['hpregenperlevel']} per level)\n")
        md.append(f"- **Mana Regeneration:** {stats['mpregen']} (+{stats['mpregenperlevel']} per level)\n\n")
    
    # Passive Ability
    passive = champion['passive']
    if language == 'ko_KR':
        md.append("## 패시브 스킬\n")
    else:
        md.append("## Passive Ability\n")
    md.append(f"### {passive['name']}\n")
    md.append(f"{clean_html_tags(passive['description'])}\n\n")
    
    # Active Abilities (Q, W, E, R)
    ability_keys = ['Q', 'W', 'E', 'R']
    if language == 'ko_KR':
        md.append("## 액티브 스킬\n\n")
    else:
        md.append("## Active Abilities\n\n")
    
    for idx, spell in enumerate(champion['spells']):
        key = ability_keys[idx] if idx < len(ability_keys) else f"Spell {idx+1}"
        
        md.append(f"### {key} - {spell['name']}\n")
        md.append(f"{clean_html_tags(spell['description'])}\n\n")
        
        # Cooldown and Cost
        cooldowns = spell['cooldownBurn']
        costs = spell['costBurn']
        
        if language == 'ko_KR':
            md.append(f"- **재사용 대기시간:** {cooldowns}초\n")
            md.append(f"- **{spell['costType'].strip()}:** {costs}\n")
            
            if spell.get('range'):
                ranges = spell['rangeBurn']
                md.append(f"- **사거리:** {ranges}\n")
        else:
            md.append(f"- **Cooldown:** {cooldowns} seconds\n")
            md.append(f"- **{spell['costType'].strip()}:** {costs}\n")
            
            if spell.get('range'):
                ranges = spell['rangeBurn']
                md.append(f"- **Range:** {ranges}\n")
        
        md.append("\n")
    
    # Gameplay Tips
    if champion.get('allytips'):
        if language == 'ko_KR':
            md.append("## " + champion['name'] + " 플레이 팁\n")
        else:
            md.append("## Tips for Playing as " + champion['name'] + "\n")
        for tip in champion['allytips']:
            md.append(f"- {tip}\n")
        md.append("\n")
    
    if champion.get('enemytips'):
        if language == 'ko_KR':
            md.append("## " + champion['name'] + " 상대 팁\n")
        else:
            md.append("## Tips for Playing Against " + champion['name'] + "\n")
        for tip in champion['enemytips']:
            md.append(f"- {tip}\n")
        md.append("\n")
    
    # Skip skins for gameplay-focused system
    
    return ''.join(md)


def process_champion_file(input_path, output_dir, language='en_US'):
    """Process a single champion JSON file"""
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get champion name from data
    champion_name = list(data['data'].keys())[0]
    
    # Convert to markdown
    markdown_content = convert_champion_to_markdown(data, language)
    
    # Save to output directory
    output_path = os.path.join(output_dir, f"{champion_name}.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Converted: {champion_name} -> {output_path}")
    return output_path


def process_all_champions(input_dir, output_dir, language='en_US'):
    """Process all champion JSON files in a directory"""
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all .json files (excluding .jsonp)
    json_files = list(Path(input_dir).glob('*.json'))
    json_files = [f for f in json_files if not f.name.endswith('.jsonp')]
    
    print(f"Found {len(json_files)} champion JSON files")
    
    converted_files = []
    for json_file in json_files:
        try:
            output_path = process_champion_file(json_file, output_dir, language)
            converted_files.append(output_path)
        except Exception as e:
            print(f"Error processing {json_file}: {e}")
    
    print(f"\nConversion complete: {len(converted_files)} champions converted")
    return converted_files


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

if __name__ == "__main__":
    # Allow version and language parameters from command line
    version = sys.argv[1] if len(sys.argv) > 1 else None
    language = sys.argv[2] if len(sys.argv) > 2 else 'en_US'
    
    # If no version specified, use the latest available version
    if not version:
        available_versions = get_available_versions()
        if not available_versions:
            print("Error: No patch version directories found")
            sys.exit(1)
        version = available_versions[0]
        print(f"Using latest version: {version}")
    
    # Process the champion folder
    input_directory = f"{version}/data/{language}/champion"
    
    # Create version-specific output directory
    if language == 'ko_KR':
        output_directory = f"gameplay_knowledge_base/{version}/champion_ko"
    else:
        output_directory = f"gameplay_knowledge_base/{version}/champion"
    
    if not os.path.exists(input_directory):
        print(f"Error: Input directory '{input_directory}' does not exist")
        sys.exit(1)
    
    print(f"Processing champions for version {version} in {language}")
    process_all_champions(input_directory, output_directory, language)
