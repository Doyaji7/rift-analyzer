import React, { useState, useEffect } from 'react';
import MatchCard from '../components/MatchCard';
import ChampionMastery from '../components/ChampionMastery';
import { config, endpoints } from '../config/environment';
import { useSession } from '../contexts/SessionContext';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../hooks/useTranslation';
import { fetchChampionData } from '../services/championService';
import './SummonerPage.css';

const SummonerPage = () => {
  const { 
    session, 
    createSession, 
    getSummonerInfo
  } = useSession();
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  const [summonerName, setSummonerName] = useState('');
  const [region, setRegion] = useState('kr');
  const [matchCount, setMatchCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState(null);
  const [summonerData, setSummonerData] = useState(null);
  const [championData, setChampionData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch champion data when language changes
  useEffect(() => {
    const loadChampionData = async () => {
      try {
        const data = await fetchChampionData(language);
        setChampionData(data);
      } catch (err) {
        console.error('Failed to fetch champion data:', err);
      }
    };
    
    loadChampionData();
  }, [language]);

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
    { value: 'kr', label: t('summoner.regions.kr') },
    { value: 'na1', label: t('summoner.regions.na1') },
    { value: 'euw1', label: t('summoner.regions.euw1') },
    { value: 'eun1', label: t('summoner.regions.eun1') },
    { value: 'jp1', label: t('summoner.regions.jp1') },
    { value: 'br1', label: t('summoner.regions.br1') },
    { value: 'la1', label: t('summoner.regions.la1') },
    { value: 'la2', label: t('summoner.regions.la2') },
    { value: 'oc1', label: t('summoner.regions.oc1') },
    { value: 'tr1', label: t('summoner.regions.tr1') },
    { value: 'ru', label: t('summoner.regions.ru') }
  ];

  const validateRiotId = (riotId) => {
    if (!riotId || !riotId.includes('#')) {
      return t('summoner.validation.formatError');
    }
    
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName.trim() || !tagLine.trim()) {
      return t('summoner.validation.emptyFields');
    }
    
    if (gameName.length > 16 || tagLine.length > 5) {
      return t('summoner.validation.lengthError');
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
        throw new Error(data.error || data.message || t('summoner.errors.collectionFailed'));
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
            setError(t('summoner.errors.sessionCreationFailed'));
          }
        } catch (sessionError) {
          console.error('Session creation error:', sessionError);
          setError(t('summoner.errors.sessionCreationError') + sessionError.message);
        }
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || t('summoner.errors.searchError'));
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
        <h2>{t('summoner.title')}</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-row">
            <div className="input-group">
              <input
                type="text"
                placeholder={t('summoner.placeholder')}
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
                <option value={5}>{t('summoner.matchCount.5')}</option>
                <option value={10}>{t('summoner.matchCount.10')}</option>
                <option value={15}>{t('summoner.matchCount.15')}</option>
                <option value={20}>{t('summoner.matchCount.20')}</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading || !summonerName.trim()}
            >
              {isLoading ? t('summoner.searching') : t('summoner.search')}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="error-message">
            <span className="error-text">{error}</span>
            <button onClick={handleRetry} className="retry-button">{t('summoner.retry')}</button>
          </div>
        )}
      </div>

      {collectionStatus && (
        <div className="collection-status">
          <h3>{t('summoner.status.title')}</h3>
          <div className="status-grid">
            <div className={`status-item ${collectionStatus.collectionStatus.matchHistory}`}>
              <span className="status-label">{t('summoner.status.matchHistory')}</span>
              <span className="status-value">
                {collectionStatus.collectionStatus.matchHistory === 'success' ? t('summoner.status.success') : t('summoner.status.failed')}
              </span>
            </div>
            <div className={`status-item ${collectionStatus.collectionStatus.mastery}`}>
              <span className="status-label">{t('summoner.status.mastery')}</span>
              <span className="status-value">
                {collectionStatus.collectionStatus.mastery === 'success' ? t('summoner.status.success') : t('summoner.status.failed')}
              </span>
            </div>
          </div>
          <p className="status-message">{collectionStatus.message}</p>
        </div>
      )}

      {summonerData && (
        <div className="results-section">
          <div className="results-grid">
            <div className="mastery-column">
              {session?.summoner?.riotId && (
                <ChampionMastery 
                  summonerName={session.summoner.riotId}
                  championData={championData}
                />
              )}
            </div>

            <div className="matches-column">
              {summonerData.matches && (
                <div className="matches-section">
                  <h3>{t('summoner.matches.title')}</h3>
                  <div className="matches-summary">
                    <div className="summary-stat">
                      <span className="stat-label">{t('summoner.matches.total')}</span>
                      <span className="stat-value">{summonerData.matches.totalMatches}{t('summoner.matches.games')}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">{t('summoner.matches.winRate')}</span>
                      <span className="stat-value">{summonerData.matches.summary?.winRate}%</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">{t('summoner.matches.record')}</span>
                      <span className="stat-value">
                        {summonerData.matches.summary?.wins}{language === 'ko_KR' ? '승' : 'W'} {summonerData.matches.summary?.losses}{language === 'ko_KR' ? '패' : 'L'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="matches-list">
                    {summonerData.matches.matches?.map((match, index) => (
                      <MatchCard 
                        key={match.matchId || index} 
                        match={match} 
                        summonerName={session?.summoner?.riotId}
                        championData={championData}
                        onAnalyze={handleAnalyzeMatch}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!collectionStatus && !isLoading && (
        <div className="results-section">
          <div className="placeholder-content">
            <h3>{t('summoner.placeholder.title')}</h3>
            <p>{t('summoner.placeholder.description')}</p>
            <ul>
              {t('summoner.placeholder.items', { returnObjects: true }).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummonerPage;