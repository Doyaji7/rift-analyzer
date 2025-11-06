import json
import boto3
import urllib3
from urllib.parse import quote
from datetime import datetime
import concurrent.futures
import time

def lambda_handler(event, context):
    """
    Orchestrates summoner data collection by calling both match-history and mastery collection.
    Expected event: {"riotId": "GameName#TAG", "region": "kr", "matchCount": 5}
    """
    
    try:
        # Parse the event body if it's a string (API Gateway format)
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        # Extract parameters
        riot_id = body.get('riotId', '').strip()
        region = body.get('region', 'kr')
        match_count = body.get('matchCount', 5)
        
        # Validate input
        if not riot_id:
            return create_response(400, {
                'error': 'Riot ID is required',
                'message': 'Please provide a valid Riot ID in the format GameName#TAG'
            })
        
        # Validate Riot ID format
        if '#' not in riot_id:
            return create_response(400, {
                'error': 'Invalid Riot ID format',
                'message': 'Please use Riot ID format: GameName#TAG (e.g., Hide on bush#KR1)'
            })
        
        # Validate region
        valid_regions = ['na1', 'br1', 'la1', 'la2', 'euw1', 'eun1', 'tr1', 'ru', 'kr', 'jp1', 'oc1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2']
        if region not in valid_regions:
            return create_response(400, {
                'error': 'Invalid region',
                'message': f'Region must be one of: {", ".join(valid_regions)}'
            })
        
        # Validate match count
        if not isinstance(match_count, int) or match_count < 1 or match_count > 20:
            return create_response(400, {
                'error': 'Invalid match count',
                'message': 'Match count must be between 1 and 20'
            })
        
        print(f"Starting data collection for {riot_id} in region {region}")
        
        # Initialize Lambda client for invoking other functions
        lambda_client = boto3.client('lambda')
        
        # Prepare payloads for both functions
        match_payload = {
            'riotId': riot_id,
            'region': region,
            'count': match_count
        }
        
        mastery_payload = {
            'riotId': riot_id,
            'region': region
        }
        
        # Execute both functions concurrently
        collection_results = {}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            # Submit both tasks
            match_future = executor.submit(
                invoke_lambda_function,
                lambda_client,
                'fetch-match-history',
                match_payload
            )
            
            mastery_future = executor.submit(
                invoke_lambda_function,
                lambda_client,
                'fetch-champion-mastery',
                mastery_payload
            )
            
            # Wait for both to complete
            try:
                match_result = match_future.result(timeout=50)  # 50 second timeout
                collection_results['matchHistory'] = match_result
            except Exception as e:
                print(f"Match history collection failed: {str(e)}")
                collection_results['matchHistory'] = {
                    'success': False,
                    'error': str(e)
                }
            
            try:
                mastery_result = mastery_future.result(timeout=30)  # 30 second timeout
                collection_results['mastery'] = mastery_result
            except Exception as e:
                print(f"Mastery collection failed: {str(e)}")
                collection_results['mastery'] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Process results and create response
        response_data = process_collection_results(riot_id, region, collection_results)
        
        # Determine overall success
        match_success = collection_results.get('matchHistory', {}).get('success', False)
        mastery_success = collection_results.get('mastery', {}).get('success', False)
        
        if match_success or mastery_success:
            return create_response(200, response_data)
        else:
            return create_response(500, {
                'error': 'Data collection failed',
                'message': 'Both match history and mastery collection failed',
                'details': response_data
            })
        
    except Exception as e:
        print(f"Error in summoner search: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred during data collection'
        })

def invoke_lambda_function(lambda_client, function_name, payload):
    """Invoke a Lambda function and return the result"""
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        # Parse the response
        response_payload = json.loads(response['Payload'].read())
        
        # Check if the function executed successfully
        if response_payload.get('statusCode') == 200:
            return {
                'success': True,
                'data': response_payload
            }
        else:
            return {
                'success': False,
                'error': response_payload.get('error', 'Unknown error'),
                'statusCode': response_payload.get('statusCode', 500)
            }
            
    except Exception as e:
        print(f"Failed to invoke {function_name}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def process_collection_results(riot_id, region, results):
    """Process and format the collection results"""
    response = {
        'summoner': riot_id,
        'region': region,
        'collectionStatus': {
            'matchHistory': 'failed',
            'mastery': 'failed'
        },
        'data': {},
        'errors': []
    }
    
    # Process match history results
    match_result = results.get('matchHistory', {})
    if match_result.get('success'):
        match_data = match_result.get('data', {})
        response['collectionStatus']['matchHistory'] = 'success'
        response['data']['matchHistory'] = {
            'matchesProcessed': match_data.get('matchesProcessed', 0),
            'matches': match_data.get('matches', []),
            'message': match_data.get('message', '')
        }
    else:
        response['errors'].append({
            'type': 'matchHistory',
            'error': match_result.get('error', 'Unknown error')
        })
    
    # Process mastery results
    mastery_result = results.get('mastery', {})
    if mastery_result.get('success'):
        mastery_data = mastery_result.get('data', {})
        response['collectionStatus']['mastery'] = 'success'
        response['data']['mastery'] = {
            'totalScore': mastery_data.get('totalScore', 0),
            'championCount': mastery_data.get('championCount', 0),
            'masteryLevels': mastery_data.get('masteryLevels', {}),
            'topChampions': mastery_data.get('topChampions', []),
            's3Location': mastery_data.get('s3Location', ''),
            'message': mastery_data.get('message', '')
        }
    else:
        response['errors'].append({
            'type': 'mastery',
            'error': mastery_result.get('error', 'Unknown error')
        })
    
    # Add data locations for successful collections
    safe_summoner_name = riot_id.replace(' ', '_')
    response['dataLocations'] = {
        'matchHistory': f"match-history/{safe_summoner_name}/",
        'mastery': f"mastery-data/{safe_summoner_name}/"
    }
    
    # Add overall status
    match_success = response['collectionStatus']['matchHistory'] == 'success'
    mastery_success = response['collectionStatus']['mastery'] == 'success'
    
    if match_success and mastery_success:
        response['overallStatus'] = 'complete'
        response['message'] = f'Successfully collected all data for {riot_id}'
    elif match_success or mastery_success:
        response['overallStatus'] = 'partial'
        response['message'] = f'Partially collected data for {riot_id}. Some data may be missing.'
    else:
        response['overallStatus'] = 'failed'
        response['message'] = f'Failed to collect data for {riot_id}. Please check the summoner name and try again.'
    
    return response

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