import json
import os
import sys

def convert_summoner_spells_to_markdown(summoner_data, language='en_US'):
    """
    Convert League of Legends summoner spells JSON data to markdown format
    optimized for gameplay knowledge base
    """
    md = []
    
    # Header with language indication
    if language == 'ko_KR':
        md.append("# 리그 오브 레전드 소환사 주문\n\n")
    else:
        md.append("# League of Legends Summoner Spells\n\n")
    
    # Process each summoner spell
    for spell_key, spell in summoner_data['data'].items():
        md.append(f"## {spell['name']}\n")
        
        # Labels based on language
        if language == 'ko_KR':
            md.append(f"**주문 ID:** {spell['id']}\n")
            md.append(f"**키:** {spell['key']}\n")
        else:
            md.append(f"**Spell ID:** {spell['id']}\n")
            md.append(f"**Key:** {spell['key']}\n")
        
        # Cooldown
        if spell.get('cooldown'):
            cooldown = spell['cooldown'][0] if isinstance(spell['cooldown'], list) else spell['cooldown']
            if language == 'ko_KR':
                md.append(f"**재사용 대기시간:** {cooldown}초\n")
            else:
                md.append(f"**Cooldown:** {cooldown} seconds\n")
        
        # Summoner level requirement
        if spell.get('summonerLevel'):
            if language == 'ko_KR':
                md.append(f"**필요 레벨:** {spell['summonerLevel']}\n")
            else:
                md.append(f"**Required Level:** {spell['summonerLevel']}\n")
        
        # Range
        if spell.get('range'):
            range_val = spell['range'][0] if isinstance(spell['range'], list) else spell['range']
            if range_val > 0:
                if language == 'ko_KR':
                    md.append(f"**사거리:** {range_val}\n")
                else:
                    md.append(f"**Range:** {range_val}\n")
        
        # Description
        if spell.get('description'):
            if language == 'ko_KR':
                md.append(f"**설명:** {spell['description']}\n")
            else:
                md.append(f"**Description:** {spell['description']}\n")
        
        # Game modes where available
        if spell.get('modes'):
            # Filter out less common modes for cleaner display
            common_modes = {
                'CLASSIC': '소환사의 협곡' if language == 'ko_KR' else 'Summoner\'s Rift',
                'ARAM': 'ARAM',
                'URF': 'URF',
                'ONEFORALL': '모두 똑같이' if language == 'ko_KR' else 'One for All',
                'TUTORIAL': '튜토리얼' if language == 'ko_KR' else 'Tutorial'
            }
            available_modes = []
            for mode in spell['modes']:
                if mode in common_modes:
                    available_modes.append(common_modes[mode])
            
            if available_modes:
                if language == 'ko_KR':
                    md.append(f"**사용 가능 모드:** {', '.join(available_modes)}\n")
                else:
                    md.append(f"**Available in:** {', '.join(available_modes)}\n")
        
        # Detailed tooltip (gameplay effects)
        if spell.get('tooltip'):
            tooltip = spell['tooltip']
            # Clean up HTML and template variables
            import re
            tooltip = tooltip.replace('<br />', '\n').replace('<br/>', '\n').replace('<br>', '\n')
            tooltip = re.sub(r'\{\{[^}]+\}\}', '[VALUE]', tooltip)  # Replace template variables
            tooltip = re.sub(r'<[^>]+>', '', tooltip)  # Remove HTML tags
            if language == 'ko_KR':
                md.append(f"**효과:** {tooltip}\n")
            else:
                md.append(f"**Effects:** {tooltip}\n")
        
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
    
    input_file = f"{version}/data/{language}/summoner.json"
    
    # Set output file based on version and language
    if language == 'ko_KR':
        output_file = f"gameplay_knowledge_base/{version}/summoner_spells_ko.md"
    else:
        output_file = f"gameplay_knowledge_base/{version}/summoner_spells.md"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist")
        return
    
    # Read summoner spells data
    with open(input_file, 'r', encoding='utf-8') as f:
        summoner_data = json.load(f)
    
    # Convert to markdown
    markdown_content = convert_summoner_spells_to_markdown(summoner_data, language)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Summoner spells converted to: {output_file}")

if __name__ == "__main__":
    # Allow version and language parameters from command line
    version = sys.argv[1] if len(sys.argv) > 1 else None
    language = sys.argv[2] if len(sys.argv) > 2 else 'en_US'
    main(version, language)