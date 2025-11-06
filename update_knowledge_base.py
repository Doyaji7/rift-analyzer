#!/usr/bin/env python3
"""
LoL Knowledge Base Update Script
Automatically processes all available patch versions and updates the knowledge base
"""

import os
import sys
import subprocess
from pathlib import Path

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

def run_conversion_script(script_name, version, language='en_US'):
    """Run a conversion script with specified parameters"""
    try:
        cmd = [sys.executable, script_name, version, language]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✓ {script_name} completed for {version} ({language})")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {script_name} failed for {version} ({language}): {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"✗ Script {script_name} not found")
        return False

def update_knowledge_base_for_version(version, languages=['en_US', 'ko_KR']):
    """Update knowledge base for a specific version"""
    print(f"\n=== Processing version {version} ===")
    
    scripts = [
        'convert_champion_to_markdown.py',
        'convert_items_to_markdown.py', 
        'convert_runes_to_markdown.py',
        'convert_summoner_spells_to_markdown.py'
    ]
    
    success_count = 0
    total_count = 0
    
    for language in languages:
        print(f"\nProcessing {language} for version {version}:")
        
        for script in scripts:
            total_count += 1
            if run_conversion_script(script, version, language):
                success_count += 1
    
    print(f"\nVersion {version} completed: {success_count}/{total_count} conversions successful")
    return success_count == total_count

def main():
    """Main function to update knowledge base"""
    print("LoL Knowledge Base Update Script")
    print("=" * 40)
    
    # Get command line arguments
    target_version = sys.argv[1] if len(sys.argv) > 1 else None
    languages = ['en_US', 'ko_KR']  # Default languages
    
    # Get available versions
    available_versions = get_available_versions()
    
    if not available_versions:
        print("Error: No patch version directories found")
        print("Expected format: 15.21.1, 15.20.1, etc.")
        sys.exit(1)
    
    print(f"Available versions: {', '.join(available_versions)}")
    
    # Determine which versions to process
    if target_version:
        if target_version not in available_versions:
            print(f"Error: Version {target_version} not found")
            sys.exit(1)
        versions_to_process = [target_version]
        print(f"Processing specific version: {target_version}")
    else:
        versions_to_process = available_versions
        print("Processing all available versions")
    
    # Process each version
    all_successful = True
    for version in versions_to_process:
        success = update_knowledge_base_for_version(version, languages)
        if not success:
            all_successful = False
    
    # Summary
    print("\n" + "=" * 40)
    if all_successful:
        print("✓ All knowledge base updates completed successfully!")
    else:
        print("⚠ Some conversions failed. Check the output above for details.")
    
    print(f"\nKnowledge base structure:")
    print("gameplay_knowledge_base/")
    for version in versions_to_process:
        print(f"├── {version}/")
        print(f"│   ├── champion/")
        print(f"│   ├── champion_ko/")
        print(f"│   ├── items.md")
        print(f"│   ├── items_ko.md")
        print(f"│   ├── runesReforged.md")
        print(f"│   ├── runesReforged_ko.md")
        print(f"│   ├── summoner_spells.md")
        print(f"│   └── summoner_spells_ko.md")

if __name__ == "__main__":
    main()