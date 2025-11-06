# 리그오브레전드 전적 분석 웹앱 요구사항

## Introduction

리그오브레전드 게임 데이터를 기반으로 한 전적 분석 및 AI 챗봇 서비스입니다. 사용자는 소환사명을 입력하여 전적을 수집하고, AI를 통해 상세한 분석과 플레이 개선 조언을 받을 수 있습니다.

## Glossary

- **Summoner_Name**: 소환사 이름 (GameName#TAG 형식, 예: "Hide on bush#KR1")
- **Match_Data**: Riot API에서 가져온 게임 매치 정보 JSON
- **Mastery_Data**: Riot API에서 가져온 챔피언 숙련도 정보
- **Champion_Data**: 15.21.1 버전 챔피언 정보 (스탯, 스킬, 이미지)
- **Knowledge_Base**: gameplay_knowledge_base의 챔피언 상세 정보 및 공략 데이터
- **AgentCore**: AWS Bedrock 기반 AI 에이전트 워크플로우 시스템
- **Analysis_Result**: AI가 생성한 매치 분석 결과
- **User_Session**: 사용자의 소환사 정보와 설정을 유지하는 세션 데이터
- **Web_App**: Amplify로 호스팅되는 프론트엔드 애플리케이션

## Requirements

### Requirement 1: 챔피언 정보 조회 시스템

**User Story:** 사용자로서, 리그오브레전드 챔피언들의 기본 정보를 조회하고 싶다.

#### Acceptance Criteria

1. WHEN 사용자가 웹앱에 접속하면, THE Web_App SHALL 모든 챔피언 목록을 표시한다
2. WHEN 사용자가 특정 챔피언을 선택하면, THE Web_App SHALL 해당 챔피언의 상세 정보를 표시한다
3. THE Web_App SHALL 챔피언 이미지, 태그, 난이도, 스탯 정보를 표시한다
4. THE Web_App SHALL 챔피언의 스킬 정보(패시브, Q, W, E, R)를 표시한다
5. THE Web_App SHALL S3에서 15.21.1 버전 Champion_Data를 로드한다

### Requirement 2: 소환사 전적 및 숙련도 수집 시스템

**User Story:** 사용자로서, 내 소환사명을 입력하여 최근 게임 전적과 챔피언 숙련도를 수집하고 싶다.

#### Acceptance Criteria

1. WHEN 사용자가 Summoner_Name을 입력하면, THE Web_App SHALL 입력 형식을 검증한다
2. WHEN 유효한 Summoner_Name이 입력되면, THE Web_App SHALL fetch-match-history Lambda를 호출한다
3. THE Web_App SHALL fetch-champion-mastery Lambda를 호출하여 챔피언 숙련도를 수집한다
4. THE Web_App SHALL 전적 및 숙련도 수집 진행 상황을 사용자에게 표시한다
5. WHEN 수집이 완료되면, THE Web_App SHALL 매치 목록과 TOP 챔피언 숙련도를 표시한다
6. THE Web_App SHALL 각 매치의 기본 정보(챔피언, KDA, 승패)와 해당 챔피언의 숙련도를 표시한다

### Requirement 3: AI 챗봇 시스템

**User Story:** 사용자로서, 챔피언 공략과 전적 분석에 대해 AI와 대화하며 조언을 얻고 싶다.

#### Acceptance Criteria

1. THE Web_App SHALL 전역 챗봇 인터페이스를 제공한다
2. WHEN 사용자가 챔피언 관련 질문을 하면, THE AgentCore SHALL Champion_Data와 Knowledge_Base를 활용하여 공략법을 제공한다
3. WHEN 사용자가 매치 분석 질문을 하면, THE AgentCore SHALL Match_Data, Mastery_Data, Knowledge_Base를 활용하여 분석 결과를 제공한다
4. THE AgentCore SHALL 질문 유형을 자동으로 판단하여 적절한 컨텍스트를 활용한다
5. THE Web_App SHALL AI 응답을 대화형 인터페이스로 표시한다
6. THE AgentCore SHALL Knowledge_Base의 챔피언 정보를 활용하여 빌드, 스킬 순서, 플레이 팁을 제공한다

### Requirement 4: 단일 매치 상세 분석

**User Story:** 사용자로서, 특정 게임에 대한 상세한 AI 분석을 받고 싶다.

#### Acceptance Criteria

1. WHEN 사용자가 특정 매치를 선택하면, THE Web_App SHALL 상세 분석을 요청한다
2. THE AgentCore SHALL 매치 타입(ARAM/협곡)에 따른 적절한 분석 프롬프트를 사용한다
3. THE AgentCore SHALL 개인 성과, 팀 기여도, 개선점을 분석한다
4. THE Web_App SHALL 분석 결과를 구조화된 형태로 표시한다
5. THE Web_App SHALL 분석 결과를 기반으로 추가 질문을 제안한다

### Requirement 5: 플레이 성향 트렌드 분석

**User Story:** 사용자로서, 여러 게임을 종합하여 내 플레이 성향과 개선점을 파악하고 싶다.

#### Acceptance Criteria

1. WHEN 사용자가 트렌드 분석을 요청하면, THE AgentCore SHALL 여러 Match_Data를 종합 분석한다
2. THE AgentCore SHALL Mastery_Data를 활용하여 선호 챔피언, 포지션별 성과, 플레이 패턴을 분석한다
3. THE AgentCore SHALL 시간대별 성과 변화 트렌드를 분석한다
4. THE Web_App SHALL 트렌드 분석 결과를 시각적으로 표시한다
5. THE AgentCore SHALL 개인화된 플레이 개선 조언을 제공한다

### Requirement 6: 사용자 세션 관리 시스템

**User Story:** 사용자로서, 소환사 정보를 한 번 입력하면 메뉴 이동 시에도 정보가 유지되기를 원한다.

#### Acceptance Criteria

1. WHEN 사용자가 유효한 Summoner_Name을 입력하면, THE Web_App SHALL User_Session을 생성한다
2. THE Web_App SHALL User_Session을 브라우저에 안전하게 저장한다
3. WHEN 사용자가 다른 페이지로 이동하면, THE Web_App SHALL User_Session을 유지한다
4. THE Web_App SHALL 세션 만료 시간을 설정하여 보안을 유지한다
5. WHEN 사용자가 로그아웃하거나 세션이 만료되면, THE Web_App SHALL User_Session을 삭제한다