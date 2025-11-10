import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Try to get saved language preference from localStorage
    const savedLanguage = localStorage.getItem('preferredLanguage');
    // Default to Korean (ko_KR) if no preference is saved
    return savedLanguage || 'ko_KR';
  });

  // Persist language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'ko_KR' ? 'en_US' : 'ko_KR';
    setLanguage(newLang);
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
