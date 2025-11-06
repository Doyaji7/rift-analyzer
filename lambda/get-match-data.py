import json
import boto3
from urllib.parse import unquote
from datetime import datetime

def lambda_handler(event, context):
    """
    Retrieves stored match history data for a summoner from S3.
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
        
        # List objects in the summoner's match history directory
        stats_prefix = f"match-history/{safe_summoner_name}/stats/"
        
        try:
            response = s3.list_objects_v2(
                Bucket=bucket_name,
                Prefix=stats_prefix,
                MaxKeys=100  # Limit to prevent large responses
            )
        except Exception as e:
            print(f"Failed to list S3 objects: {str(e)}")
            return create_response(500, {
                'error': 'Failed to access match data',
                'message': 'Could not retrieve match history from storage'
            })
        
        if 'Contents' not in response:
            return create_response(404, {
                'error': 'No match data found',
                'message': f'No match history found for {riot_id}. Please collect data first.'
            })
        
        # Get the match files (sorted by last modified, newest first)
        match_files = sorted(
            response['Contents'],
            key=lambda x: x['LastModified'],
            reverse=True
        )
        
        # Retrieve and parse match data
        matches = []
        for match_file in match_files:
            try:
                # Get the match data from S3
                obj_response = s3.get_object(
                    Bucket=bucket_name,
                    Key=match_file['Key']
                )
                
                match_data = json.loads(obj_response['Body'].read().decode('utf-8'))
                
                # Add metadata
                match_data['s3Location'] = match_file['Key']
                match_data['lastModified'] = match_file['LastModified'].isoformat()
                match_data['fileSize'] = match_file['Size']
                
                matches.append(match_data)
                
            except Exception as e:
                print(f"Failed to process match file {match_file['Key']}: {str(e)}")
                continue
        
        if not matches:
            return create_response(404, {
                'error': 'No valid match data found',
                'message': f'Match files exist but could not be processed for {riot_id}'
            })
        
        # Calculate summary statistics
        total_matches = len(matches)
        wins = sum(1 for match in matches if match.get('win', False))
        losses = total_matches - wins
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0
        
        # Get champion statistics
        champion_stats = {}
        for match in matches:
            champion = match.get('championName', 'Unknown')
            if champion not in champion_stats:
                champion_stats[champion] = {'games': 0, 'wins': 0}
            
            champion_stats[champion]['games'] += 1
            if match.get('win', False):
                champion_stats[champion]['wins'] += 1
        
        # Sort champions by games played
        top_champions = sorted(
            champion_stats.items(),
            key=lambda x: x[1]['games'],
            reverse=True
        )[:5]
        
        return create_response(200, {
            'summoner': riot_id,
            'totalMatches': total_matches,
            'summary': {
                'wins': wins,
                'losses': losses,
                'winRate': round(win_rate, 1)
            },
            'topChampions': [
                {
                    'championName': champ[0],
                    'games': champ[1]['games'],
                    'wins': champ[1]['wins'],
                    'winRate': round((champ[1]['wins'] / champ[1]['games'] * 100), 1)
                }
                for champ in top_champions
            ],
            'matches': matches,
            'dataLocation': stats_prefix,
            'lastUpdated': matches[0]['lastModified'] if matches else None
        })
        
    except Exception as e:
        print(f"Error retrieving match data: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while retrieving match data'
        })

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