import { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

export type SupportedLanguage = 'en' | 'hi' | 'es';

interface Translations {
  [key: string]: string | Translations;
}

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, variables?: Record<string, string>) => string;
  isLoading: boolean;
  availableLanguages: { code: SupportedLanguage; name: string }[];
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const AVAILABLE_LANGUAGES = [
  { code: 'en' as SupportedLanguage, name: 'English' },
  { code: 'hi' as SupportedLanguage, name: 'हिंदी (Hindi)' },
  { code: 'es' as SupportedLanguage, name: 'Español (Spanish)' },
];

const STORAGE_KEY = 'zyra_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadTranslations = async (lang: SupportedLanguage): Promise<Translations> => {
    try {
      const module = await import(`../locales/${lang}.json`);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      if (lang !== 'en') {
        const fallback = await import('../locales/en.json');
        return fallback.default || fallback;
      }
      return {};
    }
  };

  const loadLanguageFromAPI = async (): Promise<SupportedLanguage | null> => {
    try {
      const response = await apiRequest('GET', '/api/settings/preferences');
      const data = await response.json();
      
      const uiPrefs = data?.uiPreferences as { language?: string } | null;
      const savedLang = uiPrefs?.language;

      if (savedLang && ['en', 'hi', 'es'].includes(savedLang)) {
        return savedLang as SupportedLanguage;
      }
      return null;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        console.log('No user preferences found, using default');
      } else if (!error.message?.includes('401')) {
        console.error('Error loading language from API:', error.message);
      }
      return null;
    }
  };

  const saveLanguageToAPI = async (lang: SupportedLanguage): Promise<void> => {
    try {
      await apiRequest('PUT', '/api/settings/preferences', {
        uiPreferences: {
          language: lang
        }
      });
      console.log('✅ Language preference saved successfully');
    } catch (error: any) {
      if (!error.message?.includes('401')) {
        console.error('Error saving language to API:', error.message);
      }
      console.warn('⚠️ Language preference saved to localStorage only');
    }
  };

  const getNestedValue = (obj: Translations, path: string): string => {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return path;
      }
    }

    return typeof current === 'string' ? current : path;
  };

  const t = (key: string, variables?: Record<string, string>): string => {
    let translation = getNestedValue(translations, key);

    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
      });
    }

    return translation;
  };

  const changeLanguage = async (lang: SupportedLanguage) => {
    if (lang === currentLanguage) return;

    setIsTransitioning(true);

    setTimeout(async () => {
      setIsLoading(true);
      const newTranslations = await loadTranslations(lang);
      setTranslations(newTranslations);
      setCurrentLanguage(lang);
      
      document.documentElement.lang = lang;
      
      localStorage.setItem(STORAGE_KEY, lang);

      if (isAuthenticated) {
        await saveLanguageToAPI(lang);
      }

      setIsLoading(false);
      setTimeout(() => setIsTransitioning(false), 150);
    }, 150);
  };

  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);
      let langToLoad: SupportedLanguage = 'en';

      if (isAuthenticated) {
        const apiLang = await loadLanguageFromAPI();
        if (apiLang) {
          langToLoad = apiLang;
        } else {
          const localLang = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
          if (localLang && ['en', 'hi', 'es'].includes(localLang)) {
            langToLoad = localLang;
            await saveLanguageToAPI(localLang);
          }
        }
      } else {
        const localLang = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
        if (localLang && ['en', 'hi', 'es'].includes(localLang)) {
          langToLoad = localLang;
        }
      }

      const loadedTranslations = await loadTranslations(langToLoad);
      setTranslations(loadedTranslations);
      setCurrentLanguage(langToLoad);
      document.documentElement.lang = langToLoad;
      setIsLoading(false);
    };

    initializeLanguage();
  }, [isAuthenticated, user?.id]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage: changeLanguage,
        t,
        isLoading,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      <div
        style={{
          transition: 'opacity 150ms ease-in-out',
          opacity: isTransitioning || isLoading ? 0.7 : 1,
        }}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}
