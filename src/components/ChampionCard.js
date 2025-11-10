import React from 'react';
import { dataDragon } from '../config/environment';
import { useTranslation } from '../hooks/useTranslation';
import './ChampionCard.css';

const ChampionCard = ({ champion, onClick }) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (onClick) {
      onClick(champion);
    }
  };

  // Get champion image URL from CloudFront
  const getChampionImageUrl = (champion) => {
    return dataDragon.championImageUrl(dataDragon.version, champion.image.full);
  };

  return (
    <div className="champion-card" onClick={handleClick}>
      <div className="champion-image">
        <img 
          src={getChampionImageUrl(champion)} 
          alt={champion.name}
          onError={(e) => {
            e.target.style.opacity = '0.3';
            e.target.alt = `${champion.name} (이미지 로드 실패)`;
          }}
        />
        <div className="champion-overlay">
          <span className="view-details">{t('match.detail')}</span>
        </div>
      </div>
      
      <div className="champion-info">
        <h3 className="champion-name">{champion.name}</h3>
        <p className="champion-title">{champion.title}</p>
        
        <div className="champion-tags">
          {champion.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="champion-difficulty">
          <span className="difficulty-label">{t('champions.difficulty')}</span>
          <div className="difficulty-bars">
            {[...Array(3)].map((_, index) => (
              <div 
                key={index}
                className={`difficulty-bar ${index < champion.info.difficulty ? 'filled' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChampionCard;