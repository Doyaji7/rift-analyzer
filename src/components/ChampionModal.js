import React, { useState } from 'react';
import { dataDragon } from '../config/environment';
import ChatInterface from './ChatInterface';
import { getSpellImageUrl, getPassiveImageUrl } from '../utils/imageUtils';
import { useTranslation } from '../hooks/useTranslation';
import './ChampionModal.css';

const ChampionModal = ({ champion, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('info');

  if (!isOpen || !champion) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="champion-modal">
        <div className="modal-header">
          <div className="champion-header-info">
            <img 
              src={dataDragon.championImageUrl(dataDragon.version, champion.image.full)}
              alt={champion.name}
              className="champion-portrait"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="champion-title-info">
              <h2>{champion.name}</h2>
              <p className="champion-subtitle">{champion.title}</p>
              <div className="champion-tags">
                {champion.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            {t('champions.modal.info')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            {t('champions.modal.aiGuide')}
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'info' && (
            <>
              <div className="champion-stats">
                <h3>{t('champions.modal.stats')}</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">{t('champions.modal.attack')}</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{ width: `${(champion.info.attack / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-value">{champion.info.attack}/10</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">{t('champions.modal.defense')}</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{ width: `${(champion.info.defense / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-value">{champion.info.defense}/10</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">{t('champions.modal.magic')}</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{ width: `${(champion.info.magic / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-value">{champion.info.magic}/10</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">{t('champions.modal.difficulty')}</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill difficulty" 
                        style={{ width: `${(champion.info.difficulty / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-value">{champion.info.difficulty}/10</span>
                  </div>
                </div>
              </div>

              {champion.skills && (
                <div className="champion-skills">
                  <h3>{t('champions.modal.skills')}</h3>
                  <div className="skills-grid">
                    {champion.skills.map((skill, index) => (
                      <div key={index} className="skill-item">
                        <div className="skill-icon">
                          {skill.image ? (
                            <img 
                              src={skill.key === 'P' ? getPassiveImageUrl(skill.image) : getSpellImageUrl(skill.image)}
                              alt={skill.name}
                              className="skill-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className="skill-key" style={{ display: skill.image ? 'none' : 'flex' }}>
                            {skill.key}
                          </span>
                        </div>
                        <div className="skill-info">
                          <h4>{skill.name}</h4>
                          <p>{skill.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {champion.lore && (
                <div className="champion-lore">
                  <h3>{t('champions.modal.lore')}</h3>
                  <p>{champion.lore}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'chat' && (
            <div className="champion-chat-container">
              <ChatInterface 
                contextType="champion"
                contextData={{
                  championName: champion.name,
                  championData: champion
                }}
                isGlobal={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChampionModal;