import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import './MatchCard.css';

const MatchCard = ({ match, onAnalyze, summonerName }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const {
    championName,
    kills = 0,
    deaths = 0,
    assists = 0,
    win = false,
    gameMode = 'Unknown',
    gameDuration = 0,
    totalDamageDealtToChampions = 0,
    goldEarned = 0,
    visionScore = 0,
    items = [],
    gameCreation
  } = match;

  // Format game duration
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  // Calculate KDA ratio
  const kdaRatio = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : 'Perfect';

  // Format game creation time
  const formatGameTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`match-card ${win ? 'victory' : 'defeat'}`}>
      <div className="match-header">
        <div className="match-result">
          <span className={`result-text ${win ? 'victory' : 'defeat'}`}>
            {win ? '승리' : '패배'}
          </span>
          <span className="game-mode">{gameMode}</span>
        </div>
        <div className="match-time">
          <span className="duration">{formatDuration(gameDuration)}</span>
          <span className="timestamp">{formatGameTime(gameCreation)}</span>
        </div>
      </div>

      <div className="match-content">
        <div className="champion-info">
          <div className="champion-name">{championName}</div>
          <div className="champion-level">레벨 {match.champLevel || '?'}</div>
        </div>

        <div className="match-stats">
          <div className="kda-section">
            <div className="kda-numbers">
              <span className="kills">{kills}</span>
              <span className="separator">/</span>
              <span className="deaths">{deaths}</span>
              <span className="separator">/</span>
              <span className="assists">{assists}</span>
            </div>
            <div className="kda-ratio">
              {kdaRatio} KDA
            </div>
          </div>

          <div className="performance-stats">
            <div className="stat-item">
              <span className="stat-label">데미지</span>
              <span className="stat-value">{formatNumber(totalDamageDealtToChampions)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">골드</span>
              <span className="stat-value">{formatNumber(goldEarned)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">시야</span>
              <span className="stat-value">{visionScore}</span>
            </div>
          </div>
        </div>

        <div className="items-section">
          <div className="items-grid">
            {items.slice(0, 6).map((itemId, index) => (
              <div key={index} className="item-slot">
                {itemId > 0 ? (
                  <div className="item" title={`Item ${itemId}`}>
                    {itemId}
                  </div>
                ) : (
                  <div className="empty-item"></div>
                )}
              </div>
            ))}
          </div>
          {items[6] > 0 && (
            <div className="trinket-slot">
              <div className="trinket" title={`Trinket ${items[6]}`}>
                {items[6]}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="match-actions">
        <button 
          className="analyze-button"
          onClick={() => setShowAnalysis(!showAnalysis)}
          title="이 게임을 상세 분석합니다"
        >
          {showAnalysis ? '분석 닫기' : 'AI 분석'}
        </button>
        {onAnalyze && (
          <button 
            className="detail-button"
            onClick={() => onAnalyze(match)}
            title="상세 매치 정보를 봅니다"
          >
            상세보기
          </button>
        )}
      </div>

      {showAnalysis && (
        <div className="match-analysis-container">
          <ChatInterface 
            contextType="match"
            contextData={{
              matchId: match.matchId,
              summonerName: summonerName,
              championName: championName,
              gameMode: gameMode,
              win: win,
              kda: `${kills}/${deaths}/${assists}`,
              gameDuration: gameDuration
            }}
            isGlobal={false}
          />
        </div>
      )}
    </div>
  );
};

export default MatchCard;