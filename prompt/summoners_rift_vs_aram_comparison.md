# 소환사의 협곡 vs ARAM 데이터 구조 비교

## 주요 차이점

### 1. 게임 기본 정보
| 항목 | 소환사의 협곡 (Classic) | ARAM |
|------|------------------------|------|
| gameMode | "CLASSIC" | "ARAM" |
| mapId | 11 | 12 |
| 게임 시간 | 더 길음 (28분+) | 짧음 (17분) |

### 2. 포지션/라인 정보
**소환사의 협곡에만 있는 데이터:**
- `individualPosition`: "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"
- `teamPosition`: 팀 내 역할
- `lane`: "TOP", "MIDDLE", "BOTTOM", "JUNGLE"

**ARAM:**
- `individualPosition`: "Invalid"
- `teamPosition`: ""
- `lane`: "NONE"

### 3. 정글/오브젝트 관련 데이터
**소환사의 협곡에서 더 풍부한 데이터:**
- `baronKills`, `baronTakedowns`
- `dragonKills`, `dragonTakedowns`
- `neutralMinionsKilled` (정글 몬스터)
- `alliedJungleMinisterKills`, `enemyJungleMonsterKills`
- `riftHeraldTakedowns`
- `elderDragonKills`

### 4. 와드/비전 관련
**소환사의 협곡 전용:**
- `controlWardsPlaced`
- `controlWardTimeCoverageInRiverOrEnemyHalf`
- `visionScore` (더 의미있는 값)
- `wardsPlaced`, `wardsKilled`
- `stealthWardsPlaced`

### 5. 라이닝/파밍 관련
**소환사의 협곡에서 더 상세:**
- `laneMinionsFirst10Minutes` (라인별 CS)
- `jungleCsBefore10Minutes`
- `earlyLaningPhaseGoldExpAdvantage`
- `getTakedownsInAllLanesEarlyJungleAsLaner`

### 6. 전략적 지표
**소환사의 협곡 전용:**
- `baronBuffGoldAdvantageOverThreshold`
- `earliestBaron`
- `fastestLegendary`
- `epicMonsterKillsNearEnemyJungler`
- `turretPlatesTaken`

### 7. 게임 플로우
**소환사의 협곡:**
- 더 복잡한 게임 단계 (초반/중반/후반)
- 오브젝트 기반 전략
- 라인 스왑, 로밍 등

**ARAM:**
- 단순한 팀파이트 중심
- 지속적인 교전
- 포킹/이니시에이팅 중심

## 분석 시 고려사항

### 소환사의 협곡 분석 포인트
1. **라인별 성과**: 각 포지션의 역할 수행도
2. **정글 컨트롤**: 오브젝트 싸움, 정글링 효율성
3. **비전 컨트롤**: 와드 점수, 맵 컨트롤
4. **게임 템포**: 초반 우위 → 중반 오브젝트 → 후반 캐리
5. **개별 스킬**: CS, 로밍, 갱킹, 백도어

### ARAM 분석 포인트
1. **팀파이트 기여도**: 딜량, CC, 생존력
2. **포킹 능력**: 원거리 견제력
3. **이니시에이팅**: 한타 시작 능력
4. **아이템 효율성**: 제한된 골드로 최대 효과
5. **포지셔닝**: 좁은 맵에서의 위치 선정

## 프롬프트 수정 필요사항

기존 ARAM 프롬프트에 **소환사의 협곡 전용 분석 항목** 추가:
- 라인별 역할 분석
- 정글/오브젝트 컨트롤 평가
- 와드/비전 점수 분석
- CS/파밍 효율성
- 게임 단계별 기여도
- 포지션별 기대 성과 vs 실제 성과