import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('English');

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.English;
    return langDict[key] || TRANSLATIONS.English[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
