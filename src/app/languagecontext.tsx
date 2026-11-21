import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations: Record<string, Record<string, string>> = {
  en: { Settings: 'Settings', AppLanguage: 'App Language' },
  hi: { Settings: 'सेटिंग्स', AppLanguage: 'ऐप की भाषा' },
};

export const LanguageContext = createContext<{
  Language: 'en' | 'hi';
  t: (key: string) => string;
  changeLanguage: (lang: string) => Promise<void>;
}>({
  Language: 'en',
  t: (key: string) => '',
  changeLanguage: async (lang: string) => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [Language, setLanguage] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const savedLang = await AsyncStorage.getItem('appLanguage');
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang as 'en' | 'hi');
    }
  };

  const changeLanguage = async (lang: string) => {
    setLanguage(lang as 'en' | 'hi');
    await AsyncStorage.setItem('appLanguage', lang);
  };

  const t = (key: string) => {
    return translations[Language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ Language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;