import React from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTranslation } from '../hooks/useTranslation';
import './SessionManager.css';

/**
 * SessionManager Component
 * Displays current session status and provides session management controls
 */
const SessionManager = ({ showDetails = false, className = '' }) => {
  const { t } = useTranslation();
  const {
    session,
    isAuthenticated,
    isLoading,
    error,
    clearSession,
    clearError
  } = useSession();

  if (isLoading) {
    return (
      <div className={`session-manager loading ${className}`}>
        <div className="session-status">
          <span className="status-indicator loading"></span>
          <span className="status-text">{t('session.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`session-manager error ${className}`}>
        <div className="session-status">
          <span className="status-indicator error"></span>
          <span className="status-text">{t('session.error')}: {error}</span>
          <button 
            className="clear-error-btn"
            onClick={clearError}
            title={t('session.closeError')}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return (
      <div className={`session-manager unauthenticated ${className}`}>
        <div className="session-status">
          <span className="status-indicator unauthenticated"></span>
          <span className="status-text">{t('session.searchPrompt')}</span>
        </div>
      </div>
    );
  }

  const { summoner, preferences } = session;
  const expiresAt = new Date(session.expiresAt);
  const timeUntilExpiry = Math.max(0, expiresAt.getTime() - Date.now());
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const minutesUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className={`session-manager authenticated ${className}`}>
      <div className="session-status">
        <span className="status-indicator authenticated"></span>
        <div className="session-info">
          <div className="summoner-info">
            <span className="status-label">{t('session.currentSummoner')}</span>
            <span className="summoner-name">{summoner.riotId}</span>
            <span className="summoner-region">({summoner.region.toUpperCase()})</span>
          </div>
          
          {showDetails && (
            <div className="session-details">
              <div className="session-expiry">
                <span className="expiry-label">{t('session.expires')}</span>
                <span className="expiry-time">
                  {hoursUntilExpiry > 0 ? `${hoursUntilExpiry}${t('session.hoursAfter')} ` : ''}
                  {minutesUntilExpiry}{t('session.minutesAfter')}
                </span>
              </div>
              
              <div className="session-preferences">
                <span className="pref-label">{t('session.language')}</span>
                <span className="pref-value">{preferences.language}</span>
                <span className="pref-label">{t('session.theme')}</span>
                <span className="pref-value">{preferences.theme}</span>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="change-summoner-btn"
          onClick={clearSession}
          title={t('session.searchOther')}
        >
          {t('session.changeSummoner')}
        </button>
      </div>
    </div>
  );
};

export default SessionManager;