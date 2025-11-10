import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <button 
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label="언어 변경"
      title={language === 'ko_KR' ? 'Switch to English' : '한국어로 변경'}
    >
      <span className="language-icon">🌐</span>
      <span className="language-text">
        {language === 'ko_KR' ? 'KR' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageToggle;
