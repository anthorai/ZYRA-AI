import { useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ LanguageContext temporarily undefined (likely due to hot reload)');
      return {
        currentLanguage: 'en' as const,
        setLanguage: async () => {},
        t: (key: string) => key,
        isLoading: false,
        availableLanguages: [],
      };
    }
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};
