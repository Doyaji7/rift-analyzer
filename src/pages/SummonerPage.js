import React, { useState, useEffect } from 'react';
import MatchCard from '../components/MatchCard';
import { config, endpoints } from '../config/environment';
import { useSession } from '../contexts/SessionContext';
import './SummonerPage.css';

const SummonerPage = () => {
  const { 
    session, 
    createSession, 
    getSummonerInfo
  } = useSession();
  
  const [summonerName, setSummonerName] = useState('');
  const [region, setRegion] = useState('kr');
  const [matchCount, setMatchCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState(null);
  const [summonerData, setSummonerData] = useState(null);
  const [error, setError] = useState(null);

  // Initialize form with session data if available
  useEffect(() => {
    const summonerInfo = getSummonerInfo();
    if (summonerInfo) {
      setSummonerName(summonerInfo.riotId);
      setRegion(summonerInfo.region);
      // Auto-load data if session exists
      fetchSummonerData(summonerInfo.riotId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const regions = [
    { value: 'kr', label: '한국 (KR)' },
    { value: 'na1', label: '북미 (NA)' },
    { value: 'euw1', label: '서유럽 (EUW)' },
    { value: 'eun1', label: '동유럽 (EUNE)' },
    { value: 'jp1', label: '일본 (JP)' },
    { value: 'br1', label: '브라질 (BR)' },
    { value: 'la1', label: '라틴아메리카 북부 (LAN)' },
    { value: 'la2', label: '라틴아메리카 남부 (LAS)' },
    { value: 'oc1', label: '오세아니아 (OCE)' },
    { value: 'tr1', label: '터키 (TR)' },
    { value: 'ru', label: '러시아 (RU)' }
  ];

  const validateRiotId = (riotId) => {
    if (!riotId || !riotId.includes('#')) {
      return '소환사명#태그 형식으로 입력해주세요 (예: Hide on bush#KR1)';
    }
    
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName.trim() || !tagLine.trim()) {
      return '게임명과 태그를 모두 입력해주세요';
    }
    
    if (gameName.length > 16 || tagLine.length > 5) {
      return '게임명은 16자, 태그는 5자를 초과할 수 없습니다';
    }
    
    return null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    const trimmedName = summonerName.trim();
    if (!trimmedName) return;
    
    const validationError = validateRiotId(trimmedName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCollectionStatus(null);
    setSummonerData(null);
    
    try {
      // Call summoner search API
      const response = await fetch(`${config.apiUrl}${endpoints.summonerSearch}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riotId: trimmedName,
          region: region,
          matchCount: matchCount
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '데이터 수집에 실패했습니다');
      }
      
      setCollectionStatus(data);
      
      // Create session for successful data collection
      if (data.overallStatus === 'complete' || data.overallStatus === 'partial') {
        try {
          console.log('Creating session with data:', { riotId: trimmedName, region });
          
          // Create session with summoner data
          const sessionData = createSession(
            { riotId: trimmedName, region: region },
            data.dataLocations || {},
            { language: 'ko', theme: 'dark' }
          );
          
          if (sessionData) {
            console.log('Session created, fetching summoner data');
            await fetchSummonerData(trimmedName);
          } else {
            console.error('Session creation returned null');
            setError('세션 생성에 실패했습니다. 브라우저 설정을 확인해주세요.');
          }
        } catch (sessionError) {
          console.error('Session creation error:', sessionError);
          setError('세션 생성 오류: ' + sessionError.message);
        }
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || '검색 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummonerData = async (riotId) => {
    try {
      // Fetch both match history and mastery data
      const [matchResponse, masteryResponse] = await Promise.allSettled([
        fetch(`${config.apiUrl}${endpoints.summonerMatches(riotId)}`),
        fetch(`${config.apiUrl}${endpoints.summonerMastery(riotId)}`)
      ]);
      
      const data = { matches: null, mastery: null };
      
      // Process match data
      if (matchResponse.status === 'fulfilled' && matchResponse.value.ok) {
        data.matches = await matchResponse.value.json();
      }
      
      // Process mastery data
      if (masteryResponse.status === 'fulfilled' && masteryResponse.value.ok) {
        data.mastery = await masteryResponse.value.json();
      }
      
      setSummonerData(data);
      
    } catch (err) {
      console.error('Error fetching summoner data:', err);
      // Don't set error here as we already have collection status
    }
  };

  const handleAnalyzeMatch = (match) => {
    // TODO: Implement match analysis in later tasks
    alert(`${match.championName} 게임 분석 기능은 곧 구현될 예정입니다.`);
  };

  const handleRetry = () => {
    handleSearch({ preventDefault: () => {} });
  };

  return (
    <div className="summoner-page">
      <div className="search-section">
        <h2>소환사 검색</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-row">
            <div className="input-group">
              <input
                type="text"
                placeholder="소환사명#태그 (예: Hide on bush#KR1)"
                value={summonerName}
                onChange={(e) => setSummonerName(e.target.value)}
                className="summoner-input"
                disabled={isLoading}
              />
            </div>
            
            <div className="select-group">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="region-select"
                disabled={isLoading}
              >
                {regions.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            
            <div className="select-group">
              <select
                value={matchCount}
                onChange={(e) => setMatchCount(parseInt(e.target.value))}
                className="count-select"
                disabled={isLoading}
              >
                <option value={5}>5게임</option>
                <option value={10}>10게임</option>
                <option value={15}>15게임</option>
                <option value={20}>20게임</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading || !summonerName.trim()}
            >
              {isLoading ? '수집 중...' : '검색'}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="error-message">
            <span className="error-text">{error}</span>
            <button onClick={handleRetry} className="retry-button">다시 시도</button>
          </div>
        )}
      </div>

      {collectionStatus && (
        <div className="collection-status">
          <h3>데이터 수집 상태</h3>
          <div className="status-grid">
            <div className={`status-item ${collectionStatus.collectionStatus.matchHistory}`}>
              <span className="status-label">전적 수집</span>
              <span className="status-value">
                {collectionStatus.collectionStatus.matchHistory === 'success' ? '완료' : '실패'}
              </span>
            </div>
            <div className={`status-item ${collectionStatus.collectionStatus.mastery}`}>
              <span className="status-label">숙련도 수집</span>
              <span className="status-value">
                {collectionStatus.collectionStatus.mastery === 'success' ? '완료' : '실패'}
              </span>
            </div>
          </div>
          <p className="status-message">{collectionStatus.message}</p>
        </div>
      )}

      {summonerData && (
        <div className="results-section">
          {summonerData.mastery && (
            <div className="mastery-section">
              <h3>챔피언 숙련도</h3>
              <div className="mastery-summary">
                <div className="mastery-stat">
                  <span className="stat-label">총 숙련도 점수</span>
                  <span className="stat-value">{summonerData.mastery.totalScore?.toLocaleString()}</span>
                </div>
                <div className="mastery-stat">
                  <span className="stat-label">플레이한 챔피언</span>
                  <span className="stat-value">{summonerData.mastery.totalChampions}개</span>
                </div>
                <div className="mastery-stat">
                  <span className="stat-label">레벨 7 챔피언</span>
                  <span className="stat-value">{summonerData.mastery.masteryLevels?.level7 || 0}개</span>
                </div>
              </div>
              
              {summonerData.mastery.topChampions && (
                <div className="top-champions">
                  <h4>주요 챔피언</h4>
                  <div className="champions-grid">
                    {summonerData.mastery.topChampions.slice(0, 5).map((champion, index) => (
                      <div key={champion.championId} className="champion-mastery">
                        <div className="champion-rank">#{index + 1}</div>
                        <div className="champion-name">{champion.championName}</div>
                        <div className="champion-level">레벨 {champion.championLevel}</div>
                        <div className="champion-points">{champion.championPoints.toLocaleString()} 점</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {summonerData.matches && (
            <div className="matches-section">
              <h3>최근 게임 전적</h3>
              <div className="matches-summary">
                <div className="summary-stat">
                  <span className="stat-label">총 게임</span>
                  <span className="stat-value">{summonerData.matches.totalMatches}게임</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">승률</span>
                  <span className="stat-value">{summonerData.matches.summary?.winRate}%</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">승/패</span>
                  <span className="stat-value">
                    {summonerData.matches.summary?.wins}승 {summonerData.matches.summary?.losses}패
                  </span>
                </div>
              </div>
              
              <div className="matches-list">
                {summonerData.matches.matches?.map((match, index) => (
                  <MatchCard 
                    key={match.matchId || index} 
                    match={match} 
                    summonerName={session?.summoner?.riotId}
                    onAnalyze={handleAnalyzeMatch}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!collectionStatus && !isLoading && (
        <div className="results-section">
          <div className="placeholder-content">
            <h3>전적 및 숙련도 정보</h3>
            <p>소환사명을 입력하면 다음 정보들이 표시됩니다:</p>
            <ul>
              <li>최근 게임 전적 (승패, KDA, 플레이한 챔피언)</li>
              <li>챔피언 숙련도 정보</li>
              <li>게임별 상세 분석 링크</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummonerPage;