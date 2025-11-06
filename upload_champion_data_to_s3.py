#!/usr/bin/env python3
"""
Upload champion data and images to S3 bucket
Supports multiple patch versions and proper folder structure
"""

import os
import sys
import boto3
import json
from pathlib import Path
from botocore.exceptions import ClientError, NoCredentialsError

# S3 bucket configuration
BUCKET_NAME = 'rift-rewind-web-doyaji'

def get_s3_client():
    """Initialize S3 client"""
    try:
        return boto3.client('s3')
    except NoCredentialsError:
        print("Error: AWS credentials not found. Please configure your credentials.")
        sys.exit(1)

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

def upload_file_to_s3(s3_client, local_path, s3_key, content_type=None):
    """Upload a single file to S3 with proper content type and tags"""
    try:
        extra_args = {
            'Tagging': 'public=true&source=riot-api'
        }
        
        if content_type:
            extra_args['ContentType'] = content_type
        
        # Set cache control for static assets
        if s3_key.endswith(('.png', '.jpg', '.jpeg')):
            extra_args['CacheControl'] = 'max-age=86400'  # 24 hours
        elif s3_key.endswith('.json'):
            extra_args['CacheControl'] = 'max-age=3600'   # 1 hour
        
        s3_client.upload_file(local_path, BUCKET_NAME, s3_key, ExtraArgs=extra_args)
        print(f"✓ Uploaded: {s3_key}")
        return True
    except ClientError as e:
        print(f"✗ Failed to upload {s3_key}: {e}")
        return False

def upload_champion_data(s3_client, version, language='en_US'):
    """Upload champion JSON data for a specific version and language"""
    print(f"\nUploading champion data for {version} ({language})...")
    
    success_count = 0
    total_count = 0
    
    # Upload champion.json
    champion_file = f"{version}/data/{language}/champion.json"
    if os.path.exists(champion_file):
        s3_key = f"lol-data/{version}/data/{language}/champion.json"
        total_count += 1
        if upload_file_to_s3(s3_client, champion_file, s3_key, 'application/json'):
            success_count += 1
    else:
        print(f"Warning: {champion_file} not found")
    
    # Upload championFull.json if it exists
    champion_full_file = f"{version}/data/{language}/championFull.json"
    if os.path.exists(champion_full_file):
        s3_key = f"lol-data/{version}/data/{language}/championFull.json"
        total_count += 1
        if upload_file_to_s3(s3_client, champion_full_file, s3_key, 'application/json'):
            success_count += 1
    
    # Upload individual champion files
    champion_dir = f"{version}/data/{language}/champion"
    if os.path.exists(champion_dir):
        for champion_file in os.listdir(champion_dir):
            if champion_file.endswith('.json'):
                local_path = os.path.join(champion_dir, champion_file)
                s3_key = f"lol-data/{version}/data/{language}/champion/{champion_file}"
                total_count += 1
                if upload_file_to_s3(s3_client, local_path, s3_key, 'application/json'):
                    success_count += 1
    
    return success_count, total_count

def upload_champion_images(s3_client, version):
    """Upload champion images for a specific version"""
    print(f"\nUploading champion images for {version}...")
    
    success_count = 0
    total_count = 0
    
    img_dir = f"{version}/img/champion"
    if not os.path.exists(img_dir):
        print(f"Warning: {img_dir} not found")
        return success_count, total_count
    
    for img_file in os.listdir(img_dir):
        if img_file.endswith(('.png', '.jpg', '.jpeg')):
            local_path = os.path.join(img_dir, img_file)
            s3_key = f"lol-data/{version}/img/champion/{img_file}"
            total_count += 1
            if upload_file_to_s3(s3_client, local_path, s3_key, 'image/png'):
                success_count += 1
    
    return success_count, total_count

def upload_other_game_data(s3_client, version, language='en_US'):
    """Upload other game data files (items, runes, summoner spells, etc.)"""
    print(f"\nUploading other game data for {version} ({language})...")
    
    success_count = 0
    total_count = 0
    
    data_files = [
        'item.json',
        'runesReforged.json', 
        'summoner.json',
        'map.json',
        'profileicon.json'
    ]
    
    for data_file in data_files:
        local_path = f"{version}/data/{language}/{data_file}"
        if os.path.exists(local_path):
            s3_key = f"lol-data/{version}/data/{language}/{data_file}"
            total_count += 1
            if upload_file_to_s3(s3_client, local_path, s3_key, 'application/json'):
                success_count += 1
    
    return success_count, total_count

def create_version_manifest(s3_client, version):
    """Create a manifest file for the version with metadata"""
    manifest = {
        "version": version,
        "uploaded_at": "2024-11-05T00:00:00Z",
        "data_types": [
            "champions",
            "items", 
            "runes",
            "summoner_spells",
            "champion_images"
        ],
        "languages": ["en_US", "ko_KR"],
        "base_url": f"https://{BUCKET_NAME}.s3.amazonaws.com/lol-data/{version}/"
    }
    
    # Upload manifest
    manifest_content = json.dumps(manifest, indent=2)
    try:
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=f"lol-data/{version}/manifest.json",
            Body=manifest_content,
            ContentType='application/json',
            Tagging='public=true&type=manifest'
        )
        print(f"✓ Created manifest for {version}")
        return True
    except ClientError as e:
        print(f"✗ Failed to create manifest: {e}")
        return False

def main():
    """Main function to upload champion data to S3"""
    # Parse command line arguments
    target_version = sys.argv[1] if len(sys.argv) > 1 else None
    language_arg = sys.argv[2] if len(sys.argv) > 2 else 'all'
    
    # Determine languages to process
    if language_arg == 'all':
        languages = ['en_US', 'ko_KR']
    else:
        languages = [language_arg]
    
    print(f"LoL Champion Data S3 Upload Script")
    print(f"Target S3 Bucket: {BUCKET_NAME}")
    print(f"Languages: {', '.join(languages)}")
    
    # Initialize S3 client
    s3_client = get_s3_client()
    
    # Check if bucket exists
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
        print(f"✓ S3 bucket '{BUCKET_NAME}' is accessible")
    except ClientError as e:
        print(f"✗ Cannot access bucket '{BUCKET_NAME}': {e}")
        sys.exit(1)
    
    # Get available versions
    available_versions = get_available_versions()
    if not available_versions:
        print("Error: No patch version directories found")
        print("Expected format: 15.21.1, 15.20.1, etc.")
        sys.exit(1)
    
    print(f"Available versions: {', '.join(available_versions)}")
    
    # Determine which versions to upload
    if target_version:
        if target_version not in available_versions:
            print(f"Error: Version {target_version} not found")
            sys.exit(1)
        versions_to_upload = [target_version]
        print(f"Processing specific version: {target_version}")
    else:
        versions_to_upload = available_versions
        print("Processing all available versions")
    
    # Upload data for each version and language
    total_success = 0
    total_files = 0
    
    for version in versions_to_upload:
        print(f"\n{'='*50}")
        print(f"Processing version {version}")
        print(f"{'='*50}")
        
        version_success = 0
        version_total = 0
        
        # Process each language
        for language in languages:
            # Check if language directory exists
            lang_dir = f"{version}/data/{language}"
            if not os.path.exists(lang_dir):
                print(f"Warning: Language directory {lang_dir} not found, skipping...")
                continue
                
            print(f"\n--- Processing language: {language} ---")
            
            # Upload champion data
            success, count = upload_champion_data(s3_client, version, language)
            version_success += success
            version_total += count
            
            # Upload other game data
            success, count = upload_other_game_data(s3_client, version, language)
            version_success += success
            version_total += count
        
        # Upload champion images (only once per version, not per language)
        success, count = upload_champion_images(s3_client, version)
        version_success += success
        version_total += count
        
        # Create version manifest
        if create_version_manifest(s3_client, version):
            version_success += 1
        version_total += 1
        
        total_success += version_success
        total_files += version_total
        
        print(f"\nVersion {version}: {version_success}/{version_total} files uploaded successfully")
    
    print(f"\n{'='*50}")
    print("Upload Summary")
    print(f"{'='*50}")
    print(f"Total files uploaded: {total_success}/{total_files}")
    print(f"Processed {len(versions_to_upload)} version(s)")
    print(f"Languages: {', '.join(languages)}")
    print(f"S3 Bucket: {BUCKET_NAME}")
    print("\nData structure in S3:")
    for version in versions_to_upload:
        print(f"├── lol-data/{version}/")
        for lang in languages:
            if os.path.exists(f"{version}/data/{lang}"):
                print(f"│   ├── data/{lang}/")
                print(f"│   │   ├── champion.json")
                print(f"│   │   ├── item.json")
                print(f"│   │   ├── runesReforged.json")
                print(f"│   │   └── summoner.json")
        print(f"│   ├── img/champion/")
        print(f"│   │   └── [champion images]")
        print(f"│   └── manifest.json")
    
    print(f"\nUsage examples:")
    print(f"  python upload_champion_data_to_s3.py                    # Upload all versions, all languages")
    print(f"  python upload_champion_data_to_s3.py 15.21.1           # Upload specific version, all languages")
    print(f"  python upload_champion_data_to_s3.py 15.21.1 en_US     # Upload specific version, English only")
    print(f"  python upload_champion_data_to_s3.py 15.21.1 ko_KR     # Upload specific version, Korean only")

if __name__ == "__main__":
    main()