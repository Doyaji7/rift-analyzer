import React from 'react';
import { useSession } from '../contexts/SessionContext';
import SessionManager from '../components/SessionManager';
import './AnalysisPage.css';

const AnalysisPage = () => {
  const { isAuthenticated, getSummonerInfo } = useSession();
  const summonerInfo = getSummonerInfo();

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h2>매치 분석</h2>
        <p>게임 전적을 상세히 분석하고 개선점을 찾아보세요.</p>
        
        {isAuthenticated && summonerInfo && (
          <div className="current-summoner">
            <SessionManager showDetails={true} />
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="no-session-notice">
            <p>분석을 위해서는 먼저 <a href="/summoner">소환사 검색</a>에서 전적을 수집해주세요.</p>
          </div>
        )}
      </div>

      <div className="analysis-types">
        <div className="analysis-card">
          <h3>단일 매치 분석</h3>
          <p>특정 게임에 대한 상세한 AI 분석을 받아보세요.</p>
          <div className="features-list">
            <span className="feature">개인 성과 분석</span>
            <span className="feature">팀 기여도 평가</span>
            <span className="feature">개선점 제안</span>
          </div>
          <div className="status">구현 예정</div>
        </div>

        <div className="analysis-card">
          <h3>플레이 성향 트렌드</h3>
          <p>여러 게임을 종합하여 플레이 패턴을 분석합니다.</p>
          <div className="features-list">
            <span className="feature">선호 챔피언 분석</span>
            <span className="feature">포지션별 성과</span>
            <span className="feature">시간대별 트렌드</span>
          </div>
          <div className="status">구현 예정</div>
        </div>
      </div>

      <div className="analysis-preview">
        <h3>분석 예시</h3>
        <div className="preview-content">
          <div className="mock-analysis">
            <h4>📊 게임 요약</h4>
            <p>ARAM - 아우렐리온 솔 (승리)</p>
            <p>KDA: 11/11/25 (2.27:1)</p>
            
            <h4>🎯 주요 분석 포인트</h4>
            <ul>
              <li>팀파이트 기여도가 높았습니다 (딜량 1위)</li>
              <li>포킹 스킬 적중률 개선이 필요합니다</li>
              <li>아이템 빌드가 상황에 적합했습니다</li>
            </ul>
            
            <h4>💡 개선 제안</h4>
            <p>Q 스킬의 정확도를 높이기 위해 적의 이동 패턴을 더 주의깊게 관찰해보세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;