import React from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTranslation } from '../hooks/useTranslation';
import SessionManager from '../components/SessionManager';
import './AnalysisPage.css';

const AnalysisPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, getSummonerInfo } = useSession();
  const summonerInfo = getSummonerInfo();

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h2>{t('analysis.title')}</h2>
        <p>{t('analysis.description')}</p>
        
        {isAuthenticated && summonerInfo && (
          <div className="current-summoner">
            <SessionManager showDetails={true} />
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="no-session-notice">
            <p>{t('analysis.noSession')} <a href="/summoner">{t('analysis.summonerSearch')}</a>{t('analysis.collectData')}</p>
          </div>
        )}
      </div>

      <div className="analysis-types">
        <div className="analysis-card">
          <h3>{t('analysis.types.single.title')}</h3>
          <p>{t('analysis.types.single.description')}</p>
          <div className="features-list">
            <span className="feature">{t('analysis.types.single.feature1')}</span>
            <span className="feature">{t('analysis.types.single.feature2')}</span>
            <span className="feature">{t('analysis.types.single.feature3')}</span>
          </div>
          <div className="analysis-status">{t('analysis.comingSoon')}</div>
        </div>

        <div className="analysis-card">
          <h3>{t('analysis.types.trend.title')}</h3>
          <p>{t('analysis.types.trend.description')}</p>
          <div className="features-list">
            <span className="feature">{t('analysis.types.trend.feature1')}</span>
            <span className="feature">{t('analysis.types.trend.feature2')}</span>
            <span className="feature">{t('analysis.types.trend.feature3')}</span>
          </div>
          <div className="analysis-status">{t('analysis.comingSoon')}</div>
        </div>
      </div>

      <div className="analysis-preview">
        <h3>{t('analysis.preview.title')}</h3>
        <div className="preview-content">
          <div className="mock-analysis">
            <h4>📊 {t('analysis.preview.gameSummary')}</h4>
            <p>ARAM - 아우렐리온 솔 (승리)</p>
            <p>KDA: 11/11/25 (2.27:1)</p>
            
            <h4>🎯 {t('analysis.preview.keyPoints')}</h4>
            <ul>
              <li>팀파이트 기여도가 높았습니다 (딜량 1위)</li>
              <li>포킹 스킬 적중률 개선이 필요합니다</li>
              <li>아이템 빌드가 상황에 적합했습니다</li>
            </ul>
            
            <h4>💡 {t('analysis.preview.suggestions')}</h4>
            <p>Q 스킬의 정확도를 높이기 위해 적의 이동 패턴을 더 주의깊게 관찰해보세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;