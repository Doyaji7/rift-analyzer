# 리그오브레전드 전적 분석 웹앱 설계 문서

## Overview

AWS 클라우드 기반의 리그오브레전드 전적 분석 및 AI 챗봇 서비스입니다. 사용자는 소환사명을 입력하여 전적과 챔피언 숙련도를 수집하고, AgentCore와 Bedrock을 통해 개인화된 분석과 챔피언 공략을 받을 수 있습니다.

## Architecture

### High-Level Architecture
```
[GitHub] → [Amplify] → [CloudFront] → [S3 Static Assets]
                ↓
[API Gateway] → [Lambda Functions] → [S3 Data Storage]
                ↓
[AgentCore] → [Bedrock] → [Knowledge Base]
```

### Component Overview
- **Frontend**: React SPA (Amplify 호스팅)
- **API Layer**: API Gateway + Lambda Functions
- **Data Storage**: S3 (정적 데이터 + 동적 매치 데이터)
- **AI Engine**: AgentCore + Bedrock Claude
- **Session Management**: JWT + localStorage

## Components and Interfaces

### 1. Frontend Components (React)

#### Core Pages
- **HomePage**: 챔피언 정보 브라우징, 소환사 검색
- **SummonerPage**: 전적 조회, 숙련도 표시
- **AnalysisPage**: 매치 상세 분석, 트렌드 분석
- **ChatPage**: AI 챗봇 인터페이스

#### Shared Components
- **ChampionCard**: 챔피언 기본 정보 표시
- **MatchCard**: 매치 요약 정보 표시
- **ChatInterface**: 대화형 AI 인터페이스
- **SessionManager**: 사용자 세션 관리

### 2. API Gateway Endpoints

#### Champion Data APIs
```
GET /api/champions - 모든 챔피언 목록
GET /api/champions/{championId} - 특정 챔피언 상세 정보
GET /api/champions/{championId}/images - 챔피언 이미지 URL들
```

#### Summoner Data APIs
```
POST /api/summoner/search - 소환사 검색 및 데이터 수집
GET /api/summoner/{riotId}/matches - 매치 히스토리 (예: Hide_on_bush%23KR1)
GET /api/summoner/{riotId}/mastery - 챔피언 숙련도
```

#### Analysis APIs
```
POST /api/analysis/match - 단일 매치 분석
POST /api/analysis/trend - 플레이 성향 트렌드 분석
POST /api/chat - AI 챗봇 대화
```

### 3. Lambda Functions

#### fetch-match-history.py (기존)
- **Purpose**: Riot API에서 매치 데이터 수집
- **Input**: `{riotId, region, count}`
- **Output**: S3에 저장된 매치 데이터 위치
- **S3 Structure**: `match-history/{summoner}/full/`, `stats/`

#### fetch-champion-mastery.py (신규)
- **Purpose**: 챔피언 숙련도 데이터 수집
- **Input**: `{riotId, region}` (예: "Hide on bush#KR1")
- **Output**: 챔피언별 숙련도 점수, 레벨
- **S3 Structure**: `mastery-data/{safe_summoner_name}/mastery_{timestamp}.json`
- **Note**: riotId를 safe_summoner_name으로 변환 (공백→언더스코어)

#### champion-data-service.py (신규)
- **Purpose**: 15.21.1 챔피언 데이터 제공
- **Input**: `{championId}` (optional)
- **Output**: 챔피언 기본 정보, 스탯, 스킬 데이터
- **Data Source**: S3의 15.21.1 데이터

#### agentcore-handler.py (신규)
- **Purpose**: AgentCore 워크플로우 실행
- **Input**: `{query, context, sessionId}`
- **Output**: AI 분석 결과
- **Integration**: Bedrock + Knowledge Base

### 4. AgentCore Workflow Design

#### Agent Configuration
```yaml
Agent:
  name: "LoL-Analysis-Agent"
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0"
  instructions: |
    당신은 리그오브레전드 전문 분석가입니다.
    사용자의 매치 데이터와 챔피언 숙련도를 분석하여 
    개인화된 조언을 제공합니다.
```

#### Knowledge Base Integration
- **Champion Knowledge**: gameplay_knowledge_base/champion/*.md
- **Items & Runes**: gameplay_knowledge_base/*.md
- **Match Analysis Prompts**: prompt/*.md

#### Workflow Steps
1. **Context Analysis**: 질문 유형 판단 (챔피언 공략 vs 매치 분석)
2. **Data Retrieval**: 관련 데이터 수집 (S3에서 매치/숙련도 데이터)
3. **Knowledge Lookup**: 해당 챔피언/아이템 정보 검색
4. **Analysis Generation**: 종합 분석 및 조언 생성
5. **Response Formatting**: 사용자 친화적 형태로 응답 구성

## Data Models

### 1. Champion Data Model
```json
{
  "id": "Mel",
  "name": "Mel",
  "title": "the Soul's Reflection",
  "tags": ["Mage", "Support"],
  "info": {
    "attack": 2,
    "defense": 4,
    "magic": 9,
    "difficulty": 5
  },
  "stats": {
    "hp": 630,
    "hpperlevel": 93,
    "mp": 480,
    "mpperlevel": 28
  },
  "spells": [
    {
      "id": "MelQ",
      "name": "Radiant Volley",
      "description": "...",
      "cooldown": [10, 9, 8, 7, 6]
    }
  ],
  "image": {
    "full": "Mel.png",
    "sprite": "champion0.png",
    "group": "champion"
  }
}
```

### 2. Match Data Model (기존)
```json
{
  "matchId": "KR_7767375816",
  "gameMode": "ARAM",
  "gameDuration": 1046,
  "participants": [
    {
      "puuid": "...",
      "championName": "AurelionSol",
      "kills": 11,
      "deaths": 11,
      "assists": 25,
      "totalDamageDealtToChampions": 41364,
      "win": false
    }
  ]
}
```

### 3. Mastery Data Model (신규)
```json
{
  "riotId": "Hide on bush#KR1",
  "region": "kr",
  "totalScore": 847,
  "collectedAt": "2024-01-01T00:00:00Z",
  "masteries": [
    {
      "championId": 268,
      "championName": "Azir",
      "championLevel": 7,
      "championPoints": 234567,
      "lastPlayTime": 1759930346309,
      "championPointsSinceLastLevel": 12345,
      "championPointsUntilNextLevel": 0
    }
  ],
  "s3Location": "mastery-data/Hide_on_bush#KR1/mastery_20241101_123456.json"
}
```

### 4. Session Data Model
```json
{
  "sessionId": "uuid-v4",
  "summoner": {
    "riotId": "Hide on bush#KR1",
    "safeName": "Hide_on_bush#KR1",
    "region": "kr"
  },
  "dataLocations": {
    "matchHistory": "match-history/Hide_on_bush#KR1/",
    "mastery": "mastery-data/Hide_on_bush#KR1/"
  },
  "preferences": {
    "language": "ko",
    "theme": "dark"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-01T24:00:00Z"
}
```

## Error Handling

### API Error Responses
```json
{
  "error": {
    "code": "SUMMONER_NOT_FOUND",
    "message": "소환사를 찾을 수 없습니다.",
    "details": "Riot ID 형식을 확인해주세요."
  }
}
```

### Common Error Scenarios
- **Invalid Riot ID**: 형식 검증 실패
- **API Rate Limit**: Riot API 호출 제한
- **AgentCore Timeout**: AI 분석 시간 초과
- **Session Expired**: 세션 만료

### Retry Logic
- **Riot API**: 3회 재시도 (exponential backoff)
- **AgentCore**: 2회 재시도
- **S3 Operations**: 3회 재시도

## Testing Strategy

### Unit Tests
- Lambda 함수별 단위 테스트
- React 컴포넌트 테스트
- 데이터 모델 검증 테스트

### Integration Tests
- API Gateway + Lambda 통합 테스트
- AgentCore 워크플로우 테스트
- S3 데이터 저장/조회 테스트

### End-to-End Tests
- 소환사 검색 → 데이터 수집 → 분석 전체 플로우
- 챗봇 대화 시나리오 테스트
- 세션 관리 테스트

### Performance Tests
- 동시 사용자 부하 테스트
- AgentCore 응답 시간 테스트
- S3 데이터 조회 성능 테스트