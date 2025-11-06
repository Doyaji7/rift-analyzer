import json
import boto3
from urllib.parse import unquote
from datetime import datetime

def lambda_handler(event, context):
    """
    Retrieves stored champion mastery data for a summoner from S3.
    Expected path parameter: riotId (URL encoded)
    """
    
    # Configuration
    bucket_name = 'rift-rewind-match-data-doyaji'  # Replace with your actual bucket name
    
    try:
        # Extract riot ID from path parameters
        path_parameters = event.get('pathParameters', {})
        riot_id = path_parameters.get('riotId', '')
        
        if not riot_id:
            return create_response(400, {
                'error': 'Riot ID is required',
                'message': 'Please provide a valid Riot ID in the path'
            })
        
        # URL decode the riot ID
        riot_id = unquote(riot_id)
        
        # Validate Riot ID format
        if '#' not in riot_id:
            return create_response(400, {
                'error': 'Invalid Riot ID format',
                'message': 'Please use Riot ID format: GameName#TAG (e.g., Hide on bush#KR1)'
            })
        
        # Convert to safe name for S3 path
        safe_summoner_name = riot_id.replace(' ', '_')
        
        # Initialize S3 client
        s3 = boto3.client('s3')
        
        # List objects in the summoner's mastery directory
        mastery_prefix = f"mastery-data/{safe_summoner_name}/"
        
        try:
            response = s3.list_objects_v2(
                Bucket=bucket_name,
                Prefix=mastery_prefix,
                MaxKeys=50  # Should be plenty for mastery files
            )
        except Exception as e:
            print(f"Failed to list S3 objects: {str(e)}")
            return create_response(500, {
                'error': 'Failed to access mastery data',
                'message': 'Could not retrieve mastery data from storage'
            })
        
        if 'Contents' not in response:
            return create_response(404, {
                'error': 'No mastery data found',
                'message': f'No mastery data found for {riot_id}. Please collect data first.'
            })
        
        # Get the most recent mastery file
        mastery_files = sorted(
            response['Contents'],
            key=lambda x: x['LastModified'],
            reverse=True
        )
        
        if not mastery_files:
            return create_response(404, {
                'error': 'No mastery files found',
                'message': f'No mastery files found for {riot_id}'
            })
        
        # Get the most recent mastery data
        latest_file = mastery_files[0]
        
        try:
            obj_response = s3.get_object(
                Bucket=bucket_name,
                Key=latest_file['Key']
            )
            
            mastery_data = json.loads(obj_response['Body'].read().decode('utf-8'))
            
        except Exception as e:
            print(f"Failed to read mastery file {latest_file['Key']}: {str(e)}")
            return create_response(500, {
                'error': 'Failed to process mastery data',
                'message': 'Could not read mastery data file'
            })
        
        # Process and enhance the mastery data
        processed_data = process_mastery_data(mastery_data, latest_file)
        
        return create_response(200, processed_data)
        
    except Exception as e:
        print(f"Error retrieving mastery data: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while retrieving mastery data'
        })

def process_mastery_data(mastery_data, file_info):
    """Process and enhance mastery data with additional statistics"""
    try:
        masteries = mastery_data.get('masteries', [])
        
        # Calculate statistics
        total_score = mastery_data.get('totalScore', 0)
        total_champions = len(masteries)
        
        # Count by mastery levels
        level_counts = {}
        for i in range(1, 8):
            level_counts[f'level{i}'] = len([m for m in masteries if m.get('championLevel', 0) == i])
        
        # Get top champions by points
        top_champions = masteries[:10]  # Already sorted by points in the original data
        
        # Calculate average points per champion
        avg_points = total_score / total_champions if total_champions > 0 else 0
        
        # Find champions with tokens earned (for level 6/7 upgrades)
        champions_with_tokens = [
            m for m in masteries 
            if m.get('tokensEarned', 0) > 0
        ]
        
        # Find champions with chests available
        chest_available = [
            m for m in masteries 
            if not m.get('chestGranted', True)
        ]
        
        return {
            'summoner': mastery_data.get('riotId', ''),
            'region': mastery_data.get('region', ''),
            'collectedAt': mastery_data.get('collectedAt', ''),
            'totalScore': total_score,
            'totalChampions': total_champions,
            'averagePoints': round(avg_points, 0),
            'masteryLevels': level_counts,
            'topChampions': top_champions,
            'championsWithTokens': champions_with_tokens,
            'chestsAvailable': len(chest_available),
            'allMasteries': masteries,
            'fileInfo': {
                's3Location': file_info['Key'],
                'lastModified': file_info['LastModified'].isoformat(),
                'fileSize': file_info['Size']
            },
            'statistics': {
                'highestLevel': max([m.get('championLevel', 0) for m in masteries]) if masteries else 0,
                'highestPoints': max([m.get('championPoints', 0) for m in masteries]) if masteries else 0,
                'averageLevel': round(sum([m.get('championLevel', 0) for m in masteries]) / len(masteries), 2) if masteries else 0
            }
        }
        
    except Exception as e:
        print(f"Error processing mastery data: {str(e)}")
        # Return basic data if processing fails
        return {
            'summoner': mastery_data.get('riotId', ''),
            'region': mastery_data.get('region', ''),
            'collectedAt': mastery_data.get('collectedAt', ''),
            'totalScore': mastery_data.get('totalScore', 0),
            'totalChampions': len(mastery_data.get('masteries', [])),
            'allMasteries': mastery_data.get('masteries', []),
            'error': 'Some statistics could not be calculated'
        }

def create_response(status_code, body):
    """Create a properly formatted API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }