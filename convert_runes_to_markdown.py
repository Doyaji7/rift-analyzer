import json
import os
import sys

def convert_runes_to_markdown(runes_data, language='en_US'):
    """
    Convert League of Legends runes JSON data to markdown format
    optimized for gameplay knowledge base
    """
    md = []
    
    # Header with language support
    if language == 'ko_KR':
        md.append("# 리그 오브 레전드 룬 리워크\n\n")
    else:
        md.append("# League of Legends Runes Reforged\n\n")
    
    # Process each rune tree
    for tree in runes_data:
        if language == 'ko_KR':
            md.append(f"## {tree['name']} 트리\n")
            md.append(f"**트리 ID:** {tree['id']}\n")
            md.append(f"**키:** {tree['key']}\n\n")
        else:
            md.append(f"## {tree['name']} Tree\n")
            md.append(f"**Tree ID:** {tree['id']}\n")
            md.append(f"**Key:** {tree['key']}\n\n")
        
        # Process each slot (tier) in the tree
        for slot_idx, slot in enumerate(tree['slots']):
            if language == 'ko_KR':
                if slot_idx == 0:
                    md.append("### 핵심 룬\n")
                elif slot_idx == 1:
                    md.append("### 1단계 룬\n")
                elif slot_idx == 2:
                    md.append("### 2단계 룬\n")
                elif slot_idx == 3:
                    md.append("### 3단계 룬\n")
            else:
                if slot_idx == 0:
                    md.append("### Keystone Runes\n")
                elif slot_idx == 1:
                    md.append("### Tier 1 Runes\n")
                elif slot_idx == 2:
                    md.append("### Tier 2 Runes\n")
                elif slot_idx == 3:
                    md.append("### Tier 3 Runes\n")
            
            # Process each rune in the slot
            for rune in slot['runes']:
                md.append(f"#### {rune['name']}\n")
                
                if language == 'ko_KR':
                    md.append(f"**룬 ID:** {rune['id']}\n")
                    md.append(f"**키:** {rune['key']}\n")
                else:
                    md.append(f"**Rune ID:** {rune['id']}\n")
                    md.append(f"**Key:** {rune['key']}\n")
                
                # Short description
                if rune.get('shortDesc'):
                    # Clean up HTML tags
                    short_desc = rune['shortDesc']
                    import re
                    short_desc = re.sub(r'<[^>]+>', '', short_desc)
                    if language == 'ko_KR':
                        md.append(f"**요약:** {short_desc}\n")
                    else:
                        md.append(f"**Summary:** {short_desc}\n")
                
                # Long description (detailed effects)
                if rune.get('longDesc'):
                    long_desc = rune['longDesc']
                    # Clean up HTML tags and formatting
                    long_desc = long_desc.replace('<br>', '\n').replace('<br/>', '\n')
                    long_desc = long_desc.replace('<li>', '- ').replace('</li>', '')
                    
                    if language == 'ko_KR':
                        long_desc = long_desc.replace('<rules>', '\n**규칙:**\n').replace('</rules>', '')
                    else:
                        long_desc = long_desc.replace('<rules>', '\n**Rules:**\n').replace('</rules>', '')
                    
                    long_desc = long_desc.replace('<i>', '*').replace('</i>', '*')
                    long_desc = re.sub(r'<[^>]+>', '', long_desc)
                    
                    if language == 'ko_KR':
                        md.append(f"**세부사항:** {long_desc}\n")
                    else:
                        md.append(f"**Details:** {long_desc}\n")
                
                md.append("\n")
            
            md.append("\n")
        
        md.append("---\n\n")
    
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
    
    input_file = f"{version}/data/{language}/runesReforged.json"
    
    # Set output file based on version and language
    if language == 'ko_KR':
        output_file = f"gameplay_knowledge_base/{version}/runesReforged_ko.md"
    else:
        output_file = f"gameplay_knowledge_base/{version}/runesReforged.md"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist")
        return
    
    # Read runes data
    with open(input_file, 'r', encoding='utf-8') as f:
        runes_data = json.load(f)
    
    # Convert to markdown
    markdown_content = convert_runes_to_markdown(runes_data, language)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Runes converted to: {output_file}")

if __name__ == "__main__":
    # Allow version and language parameters from command line
    version = sys.argv[1] if len(sys.argv) > 1 else None
    language = sys.argv[2] if len(sys.argv) > 2 else 'en_US'
    main(version, language)