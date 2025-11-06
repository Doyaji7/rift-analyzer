#!/usr/bin/env python3
"""
AgentCore Runtime for LoL Match Analyzer using Strands Agents
This is the actual runtime code that will be deployed to BedrockAgentCore
"""

import json
import os
import boto3
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from strands import Agent
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AgentCore App
app = BedrockAgentCoreApp()

# Initialize AWS clients
s3_client = boto3.client('s3')

# Environment variables
DATA_BUCKET = os.environ.get('DATA_BUCKET', 'rift-rewind-ai-documents-doyaji')
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID', 'VUHNM8WBMA')

# Initialize Strands Agent with system prompt
system_prompt = """
당신은 리그오브레전드 전문 분석가입니다. 사용자의 매치 데이터와 챔피언 숙련도를 분석하여 개인화된 조언을 제공합니다.

## 주요 역할:
1. **챔피언 공략 제공**: 챔피언별 빌드, 스킬 순서, 플레이 팁
2. **매치 분석**: 개별 게임의 성과 분석 및 개선점 제시
3. **트렌드 분석**: 여러 게임을 종합한 플레이 성향 분석
4. **개인화된 조언**: 사용자의 숙련도와 선호도를 고려한 맞춤 조언

## 분석 지침:
- 게임 모드(ARAM, 소환사의 협곡)에 따른 다른 기준 적용
- 구체적인 수치와 데이터를 근거로 분석
- 건설적이고 실행 가능한 개선 제안 제공
- 사용자의 레벨에 맞는 적절한 조언 제공

## 응답 형식:
- 핵심 인사이트를 명확하게 제시
- 수치적 근거와 함께 설명
- 구체적이고 실행 가능한 개선 방안 제안
- 친근하고 이해하기 쉬운 한국어로 응답
"""

# Create Strands Agent with default settings (will use Bedrock automatically in AgentCore)
agent = Agent()


class LoLAnalysisAgent:
    def __init__(self):
        self.agent = agent
        self.context_handlers = {
            'champion': self._handle_champion_context,
            'match': self._handle_match_context,
            'trend': self._handle_trend_context,
            'general': self._handle_general_context
        }

    def process_request(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for processing AgentCore requests
        """
        try:
            # Extract request data
            session_id = event.get('sessionId', f"session_{int(datetime.now().timestamp())}")
            user_input = event.get('inputText', '')
            context_type = event.get('contextHandler', 'general')
            metadata = event.get('metadata', {})
            
            logger.info(f"Processing request: sessionId={session_id}, contextType={context_type}")
            
            # Handle context-specific processing
            if context_type in self.context_handlers:
                enhanced_prompt = self.context_handlers[context_type](user_input, metadata)
            else:
                enhanced_prompt = self._handle_general_context(user_input, metadata)
            
            # Generate response using Bedrock
            response = self._generate_response(enhanced_prompt)
            
            return {
                'statusCode': 200,
                'output': response,
                'sessionId': session_id,
                'metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'contextType': context_type,
                    'modelId': 'anthropic.claude-3-5-sonnet-20241022-v2:0'
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            return {
                'statusCode': 500,
                'output': f"죄송합니다. 처리 중 오류가 발생했습니다: {str(e)}",
                'error': str(e)
            }

    def _handle_champion_context(self, user_input: str, metadata: Dict[str, Any]) -> str:
        """Handle champion-specific analysis requests"""
        champion_name = metadata.get('championName', '')
        champion_data = metadata.get('championData', {})
        
        context_prompt = f"""
챔피언 분석 요청:

사용자 질문: {user_input}

챔피언 정보:
- 챔피언명: {champion_name}
"""
        
        if champion_data:
            tags = ', '.join(champion_data.get('tags', []))
            difficulty = champion_data.get('info', {}).get('difficulty', 'N/A')
            attack = champion_data.get('info', {}).get('attack', 'N/A')
            defense = champion_data.get('info', {}).get('defense', 'N/A')
            magic = champion_data.get('info', {}).get('magic', 'N/A')
            
            context_prompt += f"""
- 태그: {tags}
- 난이도: {difficulty}
- 공격력: {attack}, 방어력: {defense}, 마법력: {magic}
"""
        
        context_prompt += """
지식 베이스의 챔피언 가이드를 참조하여 빌드, 스킬 순서, 플레이 팁을 포함한 상세한 조언을 제공해주세요.
"""
        
        return context_prompt

    def _handle_match_context(self, user_input: str, metadata: Dict[str, Any]) -> str:
        """Handle match analysis requests"""
        match_id = metadata.get('matchId', '')
        summoner_name = metadata.get('summonerName', '')
        champion_name = metadata.get('championName', '')
        game_mode = metadata.get('gameMode', '')
        kda = metadata.get('kda', '')
        win = metadata.get('win', False)
        
        context_prompt = f"""
매치 분석 요청:

사용자 질문: {user_input}

매치 정보:
- 매치 ID: {match_id}
- 소환사명: {summoner_name}
- 챔피언: {champion_name}
- KDA: {kda}
- 게임 모드: {game_mode}
- 결과: {'승리' if win else '패배'}
"""
        
        # Try to load additional match data from S3
        match_data = self._load_match_data(summoner_name, match_id)
        if match_data:
            context_prompt += f"""

상세 매치 데이터가 로드되었습니다. 게임 시간, 딜량, 골드 등의 정보를 포함하여 분석해주세요.
"""
        
        context_prompt += """

위 데이터를 바탕으로 게임 모드에 맞는 상세한 성과 분석과 개선점을 제공해주세요.
"""
        
        return context_prompt

    def _handle_trend_context(self, user_input: str, metadata: Dict[str, Any]) -> str:
        """Handle trend analysis requests"""
        summoner_name = metadata.get('summonerName', '')
        match_count = metadata.get('matchCount', 10)
        
        context_prompt = f"""
트렌드 분석 요청:

사용자 질문: {user_input}

분석 대상:
- 소환사명: {summoner_name}
- 분석할 게임 수: {match_count}개
"""
        
        # Try to load recent matches and mastery data
        recent_matches = self._load_recent_matches(summoner_name, match_count)
        mastery_data = self._load_mastery_data(summoner_name)
        
        if recent_matches:
            context_prompt += f"""

최근 {len(recent_matches)}게임의 데이터가 로드되었습니다.
"""
        
        if mastery_data:
            context_prompt += """
챔피언 숙련도 데이터도 함께 분석에 활용해주세요.
"""
        
        context_prompt += """

위 데이터를 종합하여 플레이 성향, 선호 챔피언, 성과 트렌드, 개선 방향을 분석해주세요.
"""
        
        return context_prompt

    def _handle_general_context(self, user_input: str, metadata: Dict[str, Any]) -> str:
        """Handle general LoL questions"""
        return f"""
리그오브레전드 일반 질문:

사용자 질문: {user_input}

지식 베이스를 활용하여 도움이 되는 답변을 제공해주세요.
"""

    def _generate_response(self, prompt: str) -> str:
        """Generate response using Strands Agent"""
        try:
            # Combine system prompt with user prompt
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Use Strands Agent to generate response
            response = self.agent(full_prompt)
            return response
                
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return f"응답 생성 중 오류가 발생했습니다: {str(e)}"

    def _load_match_data(self, summoner_name: str, match_id: str) -> Optional[Dict[str, Any]]:
        """Load match data from S3"""
        try:
            safe_summoner = summoner_name.replace(' ', '_').replace('#', '%23')
            key = f"match-history/{safe_summoner}/full/{match_id}.json"
            
            response = s3_client.get_object(Bucket=DATA_BUCKET, Key=key)
            return json.loads(response['Body'].read().decode('utf-8'))
            
        except Exception as e:
            logger.warning(f"Could not load match data: {str(e)}")
            return None

    def _load_recent_matches(self, summoner_name: str, count: int) -> List[Dict[str, Any]]:
        """Load recent matches from S3"""
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
            logger.warning(f"Could not load recent matches: {str(e)}")
            return []

    def _load_mastery_data(self, summoner_name: str) -> Optional[Dict[str, Any]]:
        """Load mastery data from S3"""
        try:
            safe_summoner = summoner_name.replace(' ', '_').replace('#', '%23')
            prefix = f"mastery-data/{safe_summoner}/"
            
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
            logger.warning(f"Could not load mastery data: {str(e)}")
            return None


# AgentCore Runtime Entry Point
@app.entrypoint
def lol_analyzer_handler(payload, context):
    """
    Entry point for AgentCore Runtime
    This function will be called by BedrockAgentCore
    """
    try:
        # Extract prompt from payload
        user_message = payload.get("prompt", "")
        
        # Handle different context types if provided
        context_type = payload.get("contextHandler", "general")
        metadata = payload.get("metadata", {})
        
        # Create event structure for our existing handler
        event = {
            "inputText": user_message,
            "contextHandler": context_type,
            "metadata": metadata,
            "sessionId": payload.get("sessionId", f"session_{int(datetime.now().timestamp())}")
        }
        
        # Process request
        lol_agent = LoLAnalysisAgent()
        result = lol_agent.process_request(event)
        
        # Return in AgentCore format
        return {
            "result": result.get("output", "응답을 생성할 수 없습니다."),
            "metadata": result.get("metadata", {}),
            "statusCode": result.get("statusCode", 200)
        }
        
    except Exception as e:
        logger.error(f"Error in lol_analyzer_handler: {str(e)}")
        return {
            "result": f"처리 중 오류가 발생했습니다: {str(e)}",
            "statusCode": 500
        }


# For local testing and AgentCore runtime
if __name__ == "__main__":
    # Start AgentCore runtime
    app.run()