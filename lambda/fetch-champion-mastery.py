import json
import boto3
import urllib3
from urllib.parse import quote
from datetime import datetime
import time

def lambda_handler(event, context):
    """
    Fetches League of Legends champion mastery data for a summoner using Riot ID.
    Expected event: {"riotId": "GameName#TAG", "region": "kr"}
    """
    
    # Configuration - UPDATE THIS WITH YOUR BUCKET NAME
    bucket_name = 'rift-rewind-match-data-doyaji'  # Replace with your actual bucket name
    
    try:
        # Parse the event
        riot_id = event.get('riotId', '').strip()
        region = event.get('region', 'kr')
        
        # Validate input
        if not riot_id:
            return {
                'statusCode': 400,
                'error': 'Riot ID is required'
            }
        
        # Validate Riot ID format
        if '#' not in riot_id:
            return {
                'statusCode': 400,
                'error': 'Please use Riot ID format: GameName#TAG (e.g., Hide on bush#KR1)'
            }
        
        # Get API key from Parameter Store
        ssm = boto3.client('ssm')
        try:
            parameter = ssm.get_parameter(
                Name='/rift-rewind-challenge2/riot-api-key',
                WithDecryption=True
            )
            api_key = parameter['Parameter']['Value']
        except Exception as e:
            print(f"Failed to get API key: {str(e)}")
            return {
                'statusCode': 500,
                'error': 'Failed to retrieve API key'
            }
        
        # Initialize HTTP client and S3
        http = urllib3.PoolManager()
        s3 = boto3.client('s3')
        headers = {'X-Riot-Token': api_key}
        
        # Step 1: Get account PUUID using Riot ID
        game_name, tag_line = riot_id.split('#', 1)
        game_name = quote(game_name)
        tag_line = quote(tag_line)
        
        routing_value = get_routing_value(region)
        account_url = f"https://{routing_value}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        
        print(f"Fetching account data for {riot_id}")
        account_response = make_api_request(http, 'GET', account_url, headers)
        
        if account_response['status'] == 404:
            return {
                'statusCode': 404,
                'error': 'Riot ID not found. Check spelling and region.'
            }
        elif account_response['status'] == 403:
            return {
                'statusCode': 403,
                'error': 'Your API key has expired. Please regenerate it in the Riot Developer Portal.'
            }
        elif account_response['status'] != 200:
            return {
                'statusCode': account_response['status'],
                'error': f'Failed to fetch account: {account_response["status"]}'
            }
        
        account_data = account_response['data']
        puuid = account_data['puuid']
        summoner_name = f"{account_data['gameName']}#{account_data['tagLine']}"
        safe_summoner_name = summoner_name.replace(' ', '_')

        # Step 2: Get top 10 champion mastery data directly using PUUID
        mastery_url = f"https://{region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top?count=10"
        
        print(f"Fetching champion mastery for {summoner_name}")
        mastery_response = make_api_request(http, 'GET', mastery_url, headers)
        
        if mastery_response['status'] != 200:
            return {
                'statusCode': mastery_response['status'],
                'error': f'Failed to fetch champion mastery: {mastery_response["status"]}'
            }
        
        mastery_data = mastery_response['data']
        
        # Step 3: Process and enhance mastery data
        processed_mastery = process_mastery_data(mastery_data, summoner_name, region)
        
        # Step 4: Save to S3 (single file, overwrite on each request)
        s3_key = f"mastery-data/{safe_summoner_name}/mastery.json"
        
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(processed_mastery, indent=2),
            ContentType='application/json'
        )
        
        # Calculate summary statistics
        total_score = sum(mastery.get('championPoints', 0) for mastery in processed_mastery['masteries'])
        level_7_count = len([m for m in processed_mastery['masteries'] if m.get('championLevel', 0) == 7])
        level_6_count = len([m for m in processed_mastery['masteries'] if m.get('championLevel', 0) == 6])
        level_5_count = len([m for m in processed_mastery['masteries'] if m.get('championLevel', 0) == 5])
        
        return {
            'statusCode': 200,
            'summoner': summoner_name,
            'region': region,
            'totalScore': total_score,
            'championCount': len(processed_mastery['masteries']),
            'masteryLevels': {
                'level7': level_7_count,
                'level6': level_6_count,
                'level5': level_5_count
            },
            'topChampions': processed_mastery['masteries'][:5],  # Top 5 champions
            's3Location': s3_key,
            'message': f'Successfully collected mastery data for {summoner_name}'
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'error': 'Internal server error'
        }

def make_api_request(http, method, url, headers, max_retries=3):
    """Make API request with retry logic for rate limiting"""
    for attempt in range(max_retries):
        try:
            response = http.request(method, url, headers=headers)
            
            # Handle rate limiting
            if response.status == 429:
                retry_after = int(response.headers.get('Retry-After', 1))
                print(f"Rate limited. Waiting {retry_after} seconds before retry {attempt + 1}/{max_retries}")
                time.sleep(retry_after)
                continue
            
            # Parse response data if successful
            data = None
            if response.status == 200:
                data = json.loads(response.data.decode('utf-8'))
            
            return {
                'status': response.status,
                'data': data,
                'headers': dict(response.headers)
            }
            
        except Exception as e:
            print(f"Request attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                raise
            time.sleep(1)  # Wait before retry
    
    return {
        'status': 500,
        'data': None,
        'headers': {}
    }

def process_mastery_data(mastery_data, summoner_name, region):
    """Process and enhance mastery data with additional information"""
    try:
        # Load champion ID to name mapping (you might want to fetch this from S3 or have it as a constant)
        champion_id_map = get_champion_id_mapping()
        
        processed_masteries = []
        for mastery in mastery_data:
            champion_id = mastery.get('championId')
            champion_name = champion_id_map.get(str(champion_id), f"Champion_{champion_id}")
            
            processed_mastery = {
                'championId': champion_id,
                'championName': champion_name,
                'championLevel': mastery.get('championLevel', 0),
                'championPoints': mastery.get('championPoints', 0),
                'lastPlayTime': mastery.get('lastPlayTime', 0),
                'championPointsSinceLastLevel': mastery.get('championPointsSinceLastLevel', 0),
                'championPointsUntilNextLevel': mastery.get('championPointsUntilNextLevel', 0),
                'tokensEarned': mastery.get('tokensEarned', 0),
                'chestGranted': mastery.get('chestGranted', False)
            }
            processed_masteries.append(processed_mastery)
        
        # Sort by champion points (highest first)
        processed_masteries.sort(key=lambda x: x['championPoints'], reverse=True)
        
        return {
            'riotId': summoner_name,
            'region': region,
            'totalScore': sum(m['championPoints'] for m in processed_masteries),
            'collectedAt': datetime.now().isoformat(),
            'masteries': processed_masteries
        }
        
    except Exception as e:
        print(f"Error processing mastery data: {str(e)}")
        return {
            'riotId': summoner_name,
            'region': region,
            'totalScore': 0,
            'collectedAt': datetime.now().isoformat(),
            'masteries': []
        }

# Global cache for champion mapping (Lambda container reuse)
_champion_mapping_cache = None

def get_champion_id_mapping():
    """Get champion ID to name mapping from S3 champion data with caching."""
    global _champion_mapping_cache
    
    # Return cached data if available
    if _champion_mapping_cache is not None:
        return _champion_mapping_cache
    
    try:
        # Load champion data from S3
        s3 = boto3.client('s3')
        bucket_name = 'rift-rewind-web-doyaji'  # Same bucket as match data
        champion_data_key = 'lol-data/15.21.1/data/en_US/champion.json'
        
        print("Loading champion data from S3...")
        obj_response = s3.get_object(Bucket=bucket_name, Key=champion_data_key)
        champion_data = json.loads(obj_response['Body'].read().decode('utf-8'))
        
        # Create ID to name mapping
        mapping = {}
        for champ_key, champ_info in champion_data['data'].items():
            champion_id = str(champ_info['key'])  # Convert to string for consistency
            champion_name = champ_info['name']
            mapping[champion_id] = champion_name
        
        # Cache the mapping
        _champion_mapping_cache = mapping
        print(f"Loaded {len(mapping)} champions from S3")
        
        return mapping
        
    except Exception as e:
        print(f"Failed to load champion data from S3: {str(e)}")
        # Fallback to a basic mapping if S3 fails
        return {
            "1": "Annie", "2": "Olaf", "3": "Galio", "4": "TwistedFate", "5": "XinZhao",
            "22": "Ashe", "51": "Caitlyn", "81": "Ezreal", "103": "Ahri", "157": "Yasuo",
            "202": "Jhin", "222": "Jinx", "238": "Zed", "266": "Aatrox", "777": "Yone"
        }

def get_routing_value(region):
    """Map platform region to routing value for Riot API"""
    routing_map = {
        'na1': 'americas',
        'br1': 'americas',
        'la1': 'americas',
        'la2': 'americas',
        'euw1': 'europe',
        'eun1': 'europe',
        'tr1': 'europe',
        'ru': 'europe',
        'kr': 'asia',
        'jp1': 'asia',
        'oc1': 'sea',
        'ph2': 'sea',
        'sg2': 'sea',
        'th2': 'sea',
        'tw2': 'sea',
        'vn2': 'sea'
    }
    return routing_map.get(region, 'americas')