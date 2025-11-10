import React from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTranslation } from '../hooks/useTranslation';
import ChatInterface from '../components/ChatInterface';
import './HomePage.css';

const HomePage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, getSummonerInfo } = useSession();
  const summonerInfo = getSummonerInfo();

  return (
    <div className="home-page">
      <div className="home-layout">
        <div className="home-content">
          <div className="hero-section">
            <h2>{t('home.title')}</h2>
            <p>{t('home.description')}</p>
            
            {isAuthenticated && summonerInfo && (
              <div className="welcome-message">
                <p>안녕하세요, <strong>{summonerInfo.riotId}</strong>님! 
                   <a href="/summoner"> 전적 페이지</a>에서 최신 데이터를 확인하거나 
                   <a href="/analysis"> 분석 페이지</a>에서 상세 분석을 받아보세요.</p>
              </div>
            )}
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>{t('home.features.champion.title')}</h3>
              <p>{t('home.features.champion.description')}</p>
            </div>
            
            <div className="feature-card">
              <h3>{t('home.features.summoner.title')}</h3>
              <p>{t('home.features.summoner.description')}</p>
            </div>
            
            <div className="feature-card">
              <h3>{t('home.features.analysis.title')}</h3>
              <p>{t('home.features.analysis.description')}</p>
            </div>
          </div>
        </div>

        <div className="home-chatbot">
          <div className="chatbot-container">
            <div className="chatbot-header">
              <div className="bot-avatar">🤖</div>
              <h3>{t('chat.title')}</h3>
            </div>
            <ChatInterface 
              contextType="general"
              contextData={{}}
              isGlobal={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;