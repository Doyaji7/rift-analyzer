import React from 'react';
import './ChampionCard.css';

const ChampionCard = ({ champion, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(champion);
    }
  };

  // Create placeholder image URL based on champion name
  const getChampionImageUrl = (champion) => {
    return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${champion.image.full}`;
  };

  return (
    <div className="champion-card" onClick={handleClick}>
      <div className="champion-image">
        <img 
          src={getChampionImageUrl(champion)} 
          alt={champion.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200/1e2328/c89b3c?text=' + champion.name;
          }}
        />
        <div className="champion-overlay">
          <span className="view-details">상세보기</span>
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
          <span className="difficulty-label">난이도:</span>
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