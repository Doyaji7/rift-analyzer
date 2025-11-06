import json
import boto3
import urllib3
from urllib.parse import quote
from datetime import datetime

def lambda_handler(event, context):
    """
    Fetches League of Legends match history for a summoner using Riot ID.
    Expected event: {"riotId": "GameName#TAG", "region": "na1", "count": 5}
    """
    
    # Configuration - UPDATE THIS WITH YOUR BUCKET NAME
    bucket_name = 'rift-rewind-match-data-doyaji'  # Replace with your actual bucket name
    
    try:
        # Parse the event
        riot_id = event.get('riotId', '').strip()
        region = event.get('region', 'na1')
        match_count = event.get('count', 5)
        
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
        account_response = http.request('GET', account_url, headers=headers)
        
        if account_response.status == 404:
            return {
                'statusCode': 404,
                'error': 'Riot ID not found. Check spelling and region.'
            }
        elif account_response.status == 403:
            return {
                'statusCode': 403,
                'error': 'Your API key has expired. Please regenerate it in the Riot Developer Portal.'
            }
        elif account_response.status != 200:
            return {
                'statusCode': account_response.status,
                'error': f'Failed to fetch account: {account_response.status}'
            }
        
        account_data = json.loads(account_response.data.decode('utf-8'))
        puuid = account_data['puuid']
        summoner_name = f"{account_data['gameName']}#{account_data['tagLine']}"
        safe_summoner_name = summoner_name.replace(' ', '_')

        # Step 2: Get match list
        match_list_url = f"https://{routing_value}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count={match_count}"
        
        print(f"Fetching match list for {summoner_name}")
        match_list_response = http.request('GET', match_list_url, headers=headers)
        
        if match_list_response.status != 200:
            return {
                'statusCode': match_list_response.status,
                'error': f'Failed to fetch match list: {match_list_response.status}'
            }
        
        match_ids = json.loads(match_list_response.data.decode('utf-8'))
        
        if not match_ids:
            return {
                'statusCode': 404,
                'error': 'No matches found for this summoner'
            }
        
        # Step 3: Fetch and process each match
        processed_matches = []
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        for i, match_id in enumerate(match_ids):
            print(f"Processing match {i+1}/{len(match_ids)}: {match_id}")
            
            # Get full match data
            match_url = f"https://{routing_value}.api.riotgames.com/lol/match/v5/matches/{match_id}"
            match_response = http.request('GET', match_url, headers=headers)
            
            if match_response.status != 200:
                print(f"Failed to fetch match {match_id}: {match_response.status}")
                continue
            
            match_data = json.loads(match_response.data.decode('utf-8'))
            
            # Save full match data to S3
            full_key = f"match-history/{safe_summoner_name}/full/{match_id}_{timestamp}.json"
            s3.put_object(
                Bucket=bucket_name,
                Key=full_key,
                Body=json.dumps(match_data, indent=2),
                ContentType='application/json'
            )
            
            # Extract player stats
            player_stats = extract_player_stats(match_data, puuid)
            if player_stats:
                # Save extracted stats to S3
                stats_key = f"match-history/{safe_summoner_name}/stats/{match_id}_{timestamp}.json"
                s3.put_object(
                    Bucket=bucket_name,
                    Key=stats_key,
                    Body=json.dumps(player_stats, indent=2),
                    ContentType='application/json'
                )
                
                processed_matches.append({
                    'matchId': match_id,
                    'champion': player_stats.get('championName'),
                    'kda': f"{player_stats.get('kills', 0)}/{player_stats.get('deaths', 0)}/{player_stats.get('assists', 0)}",
                    'win': player_stats.get('win'),
                    'fullDataLocation': full_key,
                    'statsLocation': stats_key
                })
        
        return {
            'statusCode': 200,
            'summoner': summoner_name,
            'region': region,
            'matchesProcessed': len(processed_matches),
            'matches': processed_matches,
            'message': f'Successfully processed {len(processed_matches)} matches for {summoner_name}'
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'error': 'Internal server error'
        }

def extract_player_stats(match_data, puuid):
    """Extract relevant player statistics from match data"""
    try:
        # Find the participant data for our player
        participants = match_data['info']['participants']
        player_data = None
        
        for participant in participants:
            if participant['puuid'] == puuid:
                player_data = participant
                break
        
        if not player_data:
            return None
        
        # Extract key statistics
        stats = {
            'matchId': match_data['metadata']['matchId'],
            'gameCreation': match_data['info']['gameCreation'],
            'gameDuration': match_data['info']['gameDuration'],
            'gameMode': match_data['info']['gameMode'],
            'queueId': match_data['info']['queueId'],
            'championName': player_data['championName'],
            'championId': player_data['championId'],
            'teamPosition': player_data['teamPosition'],
            'individualPosition': player_data['individualPosition'],
            'kills': player_data['kills'],
            'deaths': player_data['deaths'],
            'assists': player_data['assists'],
            'totalMinionsKilled': player_data['totalMinionsKilled'],
            'neutralMinionsKilled': player_data['neutralMinionsKilled'],
            'goldEarned': player_data['goldEarned'],
            'totalDamageDealtToChampions': player_data['totalDamageDealtToChampions'],
            'totalDamageTaken': player_data['totalDamageTaken'],
            'visionScore': player_data['visionScore'],
            'win': player_data['win'],
            'items': [
                player_data['item0'],
                player_data['item1'],
                player_data['item2'],
                player_data['item3'],
                player_data['item4'],
                player_data['item5'],
                player_data['item6']  # trinket
            ],
            'summoner1Id': player_data['summoner1Id'],
            'summoner2Id': player_data['summoner2Id'],
            'perks': {
                'primaryStyle': player_data['perks']['styles'][0]['style'],
                'subStyle': player_data['perks']['styles'][1]['style'],
                'primaryPerk': player_data['perks']['styles'][0]['selections'][0]['perk']
            }
        }
        
        return stats
        
    except Exception as e:
        print(f"Error extracting player stats: {str(e)}")
        return None

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