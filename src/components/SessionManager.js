import React from 'react';
import { useSession } from '../contexts/SessionContext';
import './SessionManager.css';

/**
 * SessionManager Component
 * Displays current session status and provides session management controls
 */
const SessionManager = ({ showDetails = false, className = '' }) => {
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
          <span className="status-text">세션 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`session-manager error ${className}`}>
        <div className="session-status">
          <span className="status-indicator error"></span>
          <span className="status-text">세션 오류: {error}</span>
          <button 
            className="clear-error-btn"
            onClick={clearError}
            title="오류 메시지 닫기"
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
          <span className="status-text">소환사 정보 없음</span>
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
            <span className="summoner-name">{summoner.riotId}</span>
            <span className="summoner-region">({summoner.region.toUpperCase()})</span>
          </div>
          
          {showDetails && (
            <div className="session-details">
              <div className="session-expiry">
                <span className="expiry-label">세션 만료:</span>
                <span className="expiry-time">
                  {hoursUntilExpiry > 0 ? `${hoursUntilExpiry}시간 ` : ''}
                  {minutesUntilExpiry}분 후
                </span>
              </div>
              
              <div className="session-preferences">
                <span className="pref-label">언어:</span>
                <span className="pref-value">{preferences.language}</span>
                <span className="pref-label">테마:</span>
                <span className="pref-value">{preferences.theme}</span>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="logout-btn"
          onClick={clearSession}
          title="세션 종료"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default SessionManager;