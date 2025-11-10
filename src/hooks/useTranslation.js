import { useLanguage } from './useLanguage';
import ko_KR from '../locales/ko_KR.json';
import en_US from '../locales/en_US.json';

const translations = {
  ko_KR,
  en_US
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  };
  
  return { t };
};
