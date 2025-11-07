import React from 'react';
import { useSession } from '../contexts/SessionContext';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, getSummonerInfo } = useSession();
  const summonerInfo = getSummonerInfo();

  return (
    <div className="home-page">
      <div className="hero-section">
        <h2>리그오브레전드 전적 분석</h2>
        <p>챔피언 정보를 확인하고, 소환사 전적을 분석해보세요.</p>
        
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
          <h3>챔피언 정보</h3>
          <p>상단 메뉴에서 챔피언 정보를 확인하세요.</p>
        </div>
        
        <div className="feature-card">
          <h3>전적 분석</h3>
          <p>소환사명을 입력하여 최근 게임 전적을 분석받으세요.</p>
        </div>
        
        <div className="feature-card">
          <h3>AI 챗봇</h3>
          <p>우측 하단의 챗봇으로 언제든 AI와 대화하며 개인화된 플레이 조언을 받아보세요.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;