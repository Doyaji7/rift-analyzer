import React, { useState, useEffect } from 'react';
import { config, endpoints } from '../config/environment';
import { getChampionImageUrl } from '../utils/imageUtils';
import { getLocalizedChampionName } from '../services/championService';
import { useTranslation } from '../hooks/useTranslation';
import './ChampionMastery.css';

/**
 * MasteryCard sub-component
 * Displays individual champion mastery information
 */
const MasteryCard = ({ mastery, championData }) => {
  const { championId, championName, championLevel, championPoints } = mastery;
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Get localized champion name
  const localizedChampionName = championData 
    ? getLocalizedChampionName(championName, championData)
    : championName;

  return (
    <div className="mastery-card">
      <div className="mastery-champion-image-container">
        {!imageError ? (
          <img 
            src={getChampionImageUrl(championName)} 
            alt={localizedChampionName}
            className="mastery-champion-image"
            onError={handleImageError}
          />
        ) : (
          <div className="mastery-champion-placeholder">
            {localizedChampionName.charAt(0)}
          </div>
        )}
        <div className="mastery-level-badge">
          {championLevel}
        </div>
      </div>
      <div className="mastery-info">
        <div className="mastery-name">{localizedChampionName}</div>
        <div className="mastery-points">{championPoints.toLocaleString()} {t('mastery.points')}</div>
      </div>
    </div>
  );
};

/**
 * ChampionMastery component
 * Displays champion mastery data for a summoner
 */
const ChampionMastery = ({ summonerName, championData }) => {
  const { t } = useTranslation();
  const [masteryData, setMasteryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (summonerName) {
      fetchMasteryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summonerName]);

  const fetchMasteryData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.apiUrl}${endpoints.summonerMastery(summonerName)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '숙련도 데이터를 불러올 수 없습니다');
      }

      const data = await response.json();
      
      // Sort by championPoints descending and take top 20
      const sortedMasteries = [...(data.allMasteries || [])]
        .sort((a, b) => b.championPoints - a.championPoints)
        .slice(0, 20);

      setMasteryData({
        ...data,
        topMasteries: sortedMasteries
      });
    } catch (err) {
      console.error('Error fetching mastery data:', err);
      setError(err.message || '숙련도 데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchMasteryData();
  };

  if (loading) {
    return (
      <div className="champion-mastery-container">
        <h2>{t('mastery.title')}</h2>
        <div className="mastery-loading">
          <div className="loading-spinner"></div>
          <p>{t('mastery.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="champion-mastery-container">
        <h2>{t('mastery.title')}</h2>
        <div className="mastery-error">
          <p className="error-message">{error}</p>
          <button onClick={handleRetry} className="retry-button">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!masteryData || !masteryData.topMasteries || masteryData.topMasteries.length === 0) {
    return (
      <div className="champion-mastery-container">
        <h2>{t('mastery.title')}</h2>
        <div className="mastery-empty">
          <p>{t('mastery.noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="champion-mastery-container">
      <h2>{t('mastery.title')}</h2>
      
      <div className="mastery-summary">
        <div className="summary-stat">
          <span className="stat-label">{t('mastery.totalScore')}</span>
          <span className="stat-value">
            {masteryData.totalScore?.toLocaleString() || 0}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">{t('mastery.totalChampions')}</span>
          <span className="stat-value">
            {masteryData.totalChampions || 0}
          </span>
        </div>
        {masteryData.masteryLevels && (
          <div className="summary-stat">
            <span className="stat-label">{t('mastery.level7')}</span>
            <span className="stat-value">
              {masteryData.masteryLevels.level7 || 0}
            </span>
          </div>
        )}
      </div>

      <div className="mastery-grid">
        {masteryData.topMasteries.map((mastery) => (
          <MasteryCard 
            key={mastery.championId} 
            mastery={mastery}
            championData={championData}
          />
        ))}
      </div>
    </div>
  );
};

export default ChampionMastery;
