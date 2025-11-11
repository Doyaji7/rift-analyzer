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
            <p>{t('analysis.preview.example.gameMode')}</p>
            <p>{t('analysis.preview.example.kda')}</p>
            
            <h4>🎯 {t('analysis.preview.keyPoints')}</h4>
            <ul>
              <li>{t('analysis.preview.example.point1')}</li>
              <li>{t('analysis.preview.example.point2')}</li>
              <li>{t('analysis.preview.example.point3')}</li>
            </ul>
            
            <h4>💡 {t('analysis.preview.suggestions')}</h4>
            <p>{t('analysis.preview.example.suggestion')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;