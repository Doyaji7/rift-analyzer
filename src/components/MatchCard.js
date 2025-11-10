import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import { getChampionImageUrl, getItemImageUrl } from '../utils/imageUtils';
import { getLocalizedChampionName } from '../services/championService';
import { useTranslation } from '../hooks/useTranslation';
import './MatchCard.css';

const MatchCard = ({ match, onAnalyze, summonerName, championData }) => {
  const { t } = useTranslation();
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

  // Get localized champion name
  const localizedChampionName = championData 
    ? getLocalizedChampionName(championName, championData)
    : championName;

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
            {win ? t('match.victory') : t('match.defeat')}
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
          <div className="champion-avatar-container">
            <img 
              src={getChampionImageUrl(championName)} 
              alt={localizedChampionName}
              className="champion-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="champion-avatar-placeholder" style={{ display: 'none' }}>
              {localizedChampionName.charAt(0)}
            </div>
            <div className="champion-level-badge">{match.champLevel || '?'}</div>
          </div>
          <div className="champion-name">{localizedChampionName}</div>
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
              <span className="stat-label">{t('match.damage')}</span>
              <span className="stat-value">{formatNumber(totalDamageDealtToChampions)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('match.gold')}</span>
              <span className="stat-value">{formatNumber(goldEarned)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('match.vision')}</span>
              <span className="stat-value">{visionScore}</span>
            </div>
          </div>
        </div>

        <div className="items-section">
          <div className="items-grid">
            {items.slice(0, 6).map((itemId, index) => (
              <div key={index} className="item-slot">
                {itemId > 0 ? (
                  <img 
                    src={getItemImageUrl(itemId)} 
                    alt={`Item ${itemId}`}
                    className="item-image"
                    title={`Item ${itemId}`}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div className="empty-item-slot"></div>
                )}
              </div>
            ))}
          </div>
          {items[6] > 0 && (
            <div className="trinket-slot">
              <img 
                src={getItemImageUrl(items[6])} 
                alt={`Trinket ${items[6]}`}
                className="trinket-image"
                title={`Trinket ${items[6]}`}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
        </div>
      </div>

      <div className="match-actions">
        <button 
          className="analyze-button"
          onClick={(e) => {
            e.preventDefault();
            setShowAnalysis(!showAnalysis);
          }}
          title={showAnalysis ? t('match.closeAnalysis') : t('match.analyze')}
        >
          {showAnalysis ? t('match.closeAnalysis') : t('match.analyze')}
        </button>
        {onAnalyze && (
          <button 
            className="detail-button"
            onClick={(e) => {
              e.preventDefault();
              onAnalyze(match);
            }}
            title={t('match.detail')}
          >
            {t('match.detail')}
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