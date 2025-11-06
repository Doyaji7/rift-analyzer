"""
Champion Data Service Lambda Function
Provides champion data from S3 with caching and image URL generation
"""

import json
import os
import boto3
import logging
from typing import Dict, List, Optional, Any
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')

# Environment variables
DATA_BUCKET = os.getenv('DATA_BUCKET')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'prod')
DEFAULT_VERSION = '15.21.1'
DEFAULT_LANGUAGE = 'en_US'

def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        # Parse the request
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Route the request
        if path == '/api/champions':
            return handle_get_all_champions(query_parameters)
        elif path.startswith('/api/champions/'):
            champion_id = path_parameters.get('championId')
            return handle_get_champion_by_id(champion_id, query_parameters)
        else:
            return create_response(404, {'error': 'Endpoint not found'})
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_all_champions(query_params: Dict[str, str]) -> Dict[str, Any]:
    """Handle GET /api/champions - return list of all champions"""
    try:
        version = query_params.get('version', DEFAULT_VERSION)
        language = query_params.get('language', DEFAULT_LANGUAGE)
        
        # Get champion data from S3
        champion_data = get_champion_data_from_s3(version, language)
        if not champion_data:
            return create_response(404, {'error': 'Champion data not found'})
        
        # Transform data for API response
        champions_list = []
        for champion_id, champion_info in champion_data.get('data', {}).items():
            champion_summary = {
                'id': champion_info['id'],
                'key': champion_info['key'],
                'name': champion_info['name'],
                'title': champion_info['title'],
                'tags': champion_info.get('tags', []),
                'info': champion_info.get('info', {}),
                'image': {
                    'full': champion_info['image']['full'],
                    'url': generate_champion_image_url(version, champion_info['image']['full'])
                },
                'stats': {
                    'hp': champion_info['stats']['hp'],
                    'mp': champion_info['stats']['mp'],
                    'movespeed': champion_info['stats']['movespeed'],
                    'attackdamage': champion_info['stats']['attackdamage'],
                    'attackspeed': champion_info['stats']['attackspeed'],
                    'attackrange': champion_info['stats']['attackrange']
                }
            }
            champions_list.append(champion_summary)
        
        # Sort by name
        champions_list.sort(key=lambda x: x['name'])
        
        response_data = {
            'version': version,
            'language': language,
            'champions': champions_list,
            'count': len(champions_list)
        }
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error getting all champions: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve champions'})

def handle_get_champion_by_id(champion_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """Handle GET /api/champions/{championId} - return detailed champion info"""
    try:
        if not champion_id:
            return create_response(400, {'error': 'Champion ID is required'})
        
        version = query_params.get('version', DEFAULT_VERSION)
        language = query_params.get('language', DEFAULT_LANGUAGE)
        
        # Get champion data from S3
        champion_data = get_champion_data_from_s3(version, language)
        if not champion_data:
            return create_response(404, {'error': 'Champion data not found'})
        
        # Find the specific champion
        champion_info = None
        for champ_id, champ_data in champion_data.get('data', {}).items():
            if champ_data['id'].lower() == champion_id.lower() or champ_data['key'] == champion_id:
                champion_info = champ_data
                break
        
        if not champion_info:
            return create_response(404, {'error': f'Champion {champion_id} not found'})
        
        # Add image URLs to champion data
        champion_info['image']['url'] = generate_champion_image_url(version, champion_info['image']['full'])
        
        # Add image URLs to spells
        for spell in champion_info.get('spells', []):
            if 'image' in spell:
                spell['image']['url'] = generate_spell_image_url(version, spell['image']['full'])
        
        # Add image URL to passive
        if 'passive' in champion_info and 'image' in champion_info['passive']:
            champion_info['passive']['image']['url'] = generate_passive_image_url(version, champion_info['passive']['image']['full'])
        
        response_data = {
            'version': version,
            'language': language,
            'champion': champion_info
        }
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error getting champion {champion_id}: {str(e)}")
        return create_response(500, {'error': f'Failed to retrieve champion {champion_id}'})

def get_champion_data_from_s3(version: str, language: str) -> Optional[Dict[str, Any]]:
    """Retrieve champion data from S3"""
    try:
        s3_key = f"{version}/data/{language}/champion.json"
        
        logger.info(f"Fetching champion data from s3://{DATA_BUCKET}/{s3_key}")
        
        response = s3_client.get_object(Bucket=DATA_BUCKET, Key=s3_key)
        content = response['Body'].read().decode('utf-8')
        
        return json.loads(content)
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            logger.warning(f"Champion data not found: {s3_key}")
        else:
            logger.error(f"S3 error retrieving {s3_key}: {e}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error for {s3_key}: {e}")
        return None

def generate_champion_image_url(version: str, image_filename: str) -> str:
    """Generate URL for champion image"""
    return f"https://{DATA_BUCKET}.s3.amazonaws.com/{version}/img/champion/{image_filename}"

def generate_spell_image_url(version: str, image_filename: str) -> str:
    """Generate URL for spell image"""
    return f"https://{DATA_BUCKET}.s3.amazonaws.com/{version}/img/spell/{image_filename}"

def generate_passive_image_url(version: str, image_filename: str) -> str:
    """Generate URL for passive image"""
    return f"https://{DATA_BUCKET}.s3.amazonaws.com/{version}/img/passive/{image_filename}"

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }

# For local testing
if __name__ == "__main__":
    # Test event for local development
    test_event = {
        'httpMethod': 'GET',
        'path': '/api/champions',
        'queryStringParameters': {'version': '15.21.1', 'language': 'en_US'}
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))