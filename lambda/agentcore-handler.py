import json
import boto3
import os
import logging
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List
import urllib.parse

# Configure logging
logger = logging.getLogger()
logger.setLevel(getattr(logging, os.environ.get('LOG_LEVEL', 'INFO')))

# Initialize AWS clients
s3_client = boto3.client('s3')
bedrock_agentcore_client = boto3.client('bedrock-agentcore')

# Environment variables
DATA_BUCKET = os.environ.get('DATA_BUCKET', 'rift-rewind-ai-documents-doyaji')
AGENTCORE_RUNTIME_ARN = os.environ.get('AGENTCORE_RUNTIME_ARN', 'arn:aws:bedrock-agentcore:us-east-1:661893373836:runtime/riot_data_analyzer-pE01nfE4X0')

def lambda_handler(event, context):
    """
    Handle AI chatbot interactions using Bedrock Agent
    """
    try:
        # Parse request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract parameters
        query = body.get('query', '')
        session_id = body.get('sessionId', f"session_{int(datetime.now().timestamp())}")
        context_type = body.get('contextType', 'general')  # 'champion', 'match', 'trend', 'general'
        context_data = body.get('contextData', {})
        
        logger.info(f"Processing chat request: query='{query}', contextType='{context_type}', sessionId='{session_id}'")
        
        if not query:
            return create_response(400, {'error': 'Query is required'})
        
        # Prepare context based on type
        enhanced_query = prepare_context_enhanced_query(query, context_type, context_data)
        
        # Call BedrockAgentCore Runtime
        response = invoke_agentcore_runtime(enhanced_query, session_id, context_type)
        
        return create_response(200, {
            'response': response,
            'sessionId': session_id,
            'contextType': context_type,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })

def prepare_context_enhanced_query(query: str, context_type: str, context_data: Dict[str, Any]) -> str:
    """
    Enhance the user query with relevant context based on the type of analysis requested
    """
    try:
        if context_type == 'champion':
            return prepare_champion_context(query, context_data)
        elif context_type == 'match':
            return prepare_match_context(query, context_data)
        elif context_type == 'trend':
            return prepare_trend_context(query, context_data)
        else:
            return query
            
    except Exception as e:
        logger.warning(f"Error preparing context: {str(e)}")
        return query

def prepare_champion_context(query: str, context_data: Dict[str, Any]) -> str:
    """
    Prepare context for champion-related queries
    """
    champion_name = context_data.get('championName', '')
    champion_data = context_data.get('championData', {})
    
    context_prompt = f"""
챔피언 분석 요청:

사용자 질문: {query}

챔피언 정보:
- 챔피언명: {champion_name}
"""
    
    if champion_data:
        context_prompt += f"""
- 태그: {', '.join(champion_data.get('tags', []))}
- 난이도: {champion_data.get('info', {}).get('difficulty', 'N/A')}
- 주요 스탯: 공격력 {champion_data.get('info', {}).get('attack', 'N/A')}, 방어력 {champion_data.get('info', {}).get('defense', 'N/A')}, 마법력 {champion_data.get('info', {}).get('magic', 'N/A')}
"""
    
    context_prompt += """
지식 베이스의 챔피언 가이드를 참조하여 빌드, 스킬 순서, 플레이 팁을 포함한 상세한 조언을 제공해주세요.
"""
    
    return context_prompt

def prepare_match_context(query: str, context_data: Dict[str, Any]) -> str:
    """
    Prepare context for match analysis queries
    """
    match_id = context_data.get('matchId', '')
    summoner_name = context_data.get('summonerName', '')
    
    context_prompt = f"""
매치 분석 요청:

사용자 질문: {query}

매치 정보:
- 매치 ID: {match_id}
- 소환사명: {summoner_name}
"""
    
    # Try to load match data from S3
    match_data = load_match_data_from_s3(summoner_name, match_id)
    if match_data:
        participant = find_participant_data(match_data, summoner_name)
        if participant:
            context_prompt += f"""

매치 데이터:
- 챔피언: {participant.get('championName', 'N/A')}
- KDA: {participant.get('kills', 0)}/{participant.get('deaths', 0)}/{participant.get('assists', 0)}
- 게임 모드: {match_data.get('info', {}).get('gameMode', 'N/A')}
- 게임 시간: {match_data.get('info', {}).get('gameDuration', 0)}초
- 승패: {'승리' if participant.get('win', False) else '패배'}
- 딜량: {participant.get('totalDamageDealtToChampions', 0)}
- 골드: {participant.get('goldEarned', 0)}
"""
    
    # Try to load mastery data
    mastery_data = load_mastery_data_from_s3(summoner_name)
    if mastery_data and match_data and participant:
        champion_name = participant.get('championName', '')
        champion_mastery = find_champion_mastery(mastery_data, champion_name)
        if champion_mastery:
            context_prompt += f"""

챔피언 숙련도:
- 숙련도 레벨: {champion_mastery.get('championLevel', 0)}
- 숙련도 점수: {champion_mastery.get('championPoints', 0):,}
"""
    
    context_prompt += """

위 데이터를 바탕으로 게임 모드에 맞는 상세한 성과 분석과 개선점을 제공해주세요.
"""
    
    return context_promptd
ef prepare_trend_context(query: str, context_data: Dict[str, Any]) -> str:
    """
    Prepare context for trend analysis queries
    """
    summoner_name = context_data.get('summonerName', '')
    match_count = context_data.get('matchCount', 10)
    
    context_prompt = f"""
트렌드 분석 요청:

사용자 질문: {query}

분석 대상:
- 소환사명: {summoner_name}
- 분석할 게임 수: {match_count}개
"""
    
    # Load recent matches data
    matches_data = load_recent_matches_from_s3(summoner_name, match_count)
    if matches_data:
        context_prompt += f"""

최근 {len(matches_data)}게임 요약:
"""
        for i, match in enumerate(matches_data[:5], 1):  # Show first 5 matches
            participant = find_participant_data(match, summoner_name)
            if participant:
                context_prompt += f"""
{i}. {participant.get('championName', 'N/A')} - {participant.get('kills', 0)}/{participant.get('deaths', 0)}/{participant.get('assists', 0)} ({'승' if participant.get('win', False) else '패'})
"""
    
    # Load mastery data
    mastery_data = load_mastery_data_from_s3(summoner_name)
    if mastery_data:
        top_champions = sorted(
            mastery_data.get('masteries', [])[:5], 
            key=lambda x: x.get('championPoints', 0), 
            reverse=True
        )
        context_prompt += f"""

주요 챔피언 숙련도:
"""
        for champ in top_champions:
            context_prompt += f"""
- {champ.get('championName', 'N/A')}: 레벨 {champ.get('championLevel', 0)}, {champ.get('championPoints', 0):,}점
"""
    
    context_prompt += """

위 데이터를 종합하여 플레이 성향, 선호 챔피언, 성과 트렌드, 개선 방향을 분석해주세요.
"""
    
    return context_prompt

def load_match_data_from_s3(summoner_name: str, match_id: str) -> Optional[Dict[str, Any]]:
    """
    Load specific match data from S3
    """
    try:
        safe_summoner = summoner_name.replace(' ', '_').replace('#', '%23')
        key = f"match-history/{safe_summoner}/full/{match_id}.json"
        
        response = s3_client.get_object(Bucket=DATA_BUCKET, Key=key)
        return json.loads(response['Body'].read().decode('utf-8'))
        
    except Exception as e:
        logger.warning(f"Could not load match data for {match_id}: {str(e)}")
        return None

def load_recent_matches_from_s3(summoner_name: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    Load recent matches data from S3
    """
    try:
        safe_summoner = summoner_name.replace(' ', '_').replace('#', '%23')
        prefix = f"match-history/{safe_summoner}/full/"
        
        response = s3_client.list_objects_v2(
            Bucket=DATA_BUCKET,
            Prefix=prefix,
            MaxKeys=count
        )
        
        matches = []
        for obj in response.get('Contents', [])[:count]:
            try:
                match_response = s3_client.get_object(Bucket=DATA_BUCKET, Key=obj['Key'])
                match_data = json.loads(match_response['Body'].read().decode('utf-8'))
                matches.append(match_data)
            except Exception as e:
                logger.warning(f"Could not load match from {obj['Key']}: {str(e)}")
                continue
        
        return matches
        
    except Exception as e:
        logger.warning(f"Could not load recent matches for {summoner_name}: {str(e)}")
        return []

def load_mastery_data_from_s3(summoner_name: str) -> Optional[Dict[str, Any]]:
    """
    Load champion mastery data from S3
    """
    try:
        safe_summoner = summoner_name.replace(' ', '_').replace('#', '%23')
        prefix = f"mastery-data/{safe_summoner}/"
        
        # Get the most recent mastery file
        response = s3_client.list_objects_v2(
            Bucket=DATA_BUCKET,
            Prefix=prefix,
            MaxKeys=1
        )
        
        if not response.get('Contents'):
            return None
        
        latest_key = response['Contents'][0]['Key']
        mastery_response = s3_client.get_object(Bucket=DATA_BUCKET, Key=latest_key)
        return json.loads(mastery_response['Body'].read().decode('utf-8'))
        
    except Exception as e:
        logger.warning(f"Could not load mastery data for {summoner_name}: {str(e)}")
        return None

def find_participant_data(match_data: Dict[str, Any], summoner_name: str) -> Optional[Dict[str, Any]]:
    """
    Find participant data for the specific summoner in match data
    """
    try:
        participants = match_data.get('info', {}).get('participants', [])
        safe_summoner = summoner_name.replace(' ', '_').replace('#', '%23')
        
        for participant in participants:
            # Try different name formats
            riot_id = participant.get('riotIdGameName', '') + '#' + participant.get('riotIdTagline', '')
            if (riot_id == summoner_name or 
                participant.get('summonerName', '') == summoner_name or
                participant.get('riotIdGameName', '') == summoner_name.split('#')[0]):
                return participant
        
        return None
        
    except Exception as e:
        logger.warning(f"Could not find participant data: {str(e)}")
        return None

def find_champion_mastery(mastery_data: Dict[str, Any], champion_name: str) -> Optional[Dict[str, Any]]:
    """
    Find mastery data for specific champion
    """
    try:
        masteries = mastery_data.get('masteries', [])
        for mastery in masteries:
            if mastery.get('championName', '').lower() == champion_name.lower():
                return mastery
        return None
        
    except Exception as e:
        logger.warning(f"Could not find champion mastery: {str(e)}")
        return None

def invoke_agentcore_runtime(query: str, session_id: str, context_type: str) -> str:
    """
    Invoke BedrockAgentCore Runtime with the enhanced query
    """
    try:
        if not AGENTCORE_RUNTIME_ARN:
            raise Exception("AgentCore Runtime ARN not configured")
        
        # Prepare payload for AgentCore Runtime
        payload_data = {
            'prompt': query,
            'contextHandler': context_type,
            'sessionId': session_id,
            'metadata': {
                "timestamp": datetime.now().isoformat(),
                "source": "lol-match-analyzer"
            }
        }
        
        # Convert payload to bytes
        payload_bytes = json.dumps(payload_data).encode('utf-8')
        
        # Prepare request for BedrockAgentCore Runtime
        response = bedrock_agentcore_client.invoke_agent_runtime(
            runtimeSessionId=session_id,
            agentRuntimeArn=AGENTCORE_RUNTIME_ARN,
            qualifier="DEFAULT",
            payload=payload_bytes
        )
        
        # Parse streaming response
        if 'response' in response:
            response_text = ""
            for event in response['response']:
                if 'chunk' in event:
                    chunk_data = event['chunk']
                    if 'bytes' in chunk_data:
                        chunk_text = chunk_data['bytes'].decode('utf-8')
                        response_text += chunk_text
            
            if response_text:
                # Try to parse as JSON first
                try:
                    parsed_response = json.loads(response_text)
                    return parsed_response.get('result', response_text)
                except json.JSONDecodeError:
                    return response_text
        
        return '응답을 처리할 수 없습니다.'
        
    except Exception as e:
        logger.error(f"Error invoking BedrockAgentCore Runtime: {str(e)}")
        raise Exception(f"AI 분석 중 오류가 발생했습니다: {str(e)}")

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create standardized API response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }