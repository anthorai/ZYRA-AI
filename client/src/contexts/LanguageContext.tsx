import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

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

  const loadLanguageFromSupabase = async (userId: string): Promise<SupportedLanguage | null> => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('ui_preferences')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.error('🔒 RLS Policy Error (SELECT): User lacks permission to read preferences. RLS policies may be missing.', error);
        } else if (error.code === 'PGRST116') {
          console.log('No user preferences found, using default');
        } else {
          console.error('Error loading language from Supabase:', error);
        }
        return null;
      }

      const uiPrefs = data?.ui_preferences as { language?: string } | null;
      const savedLang = uiPrefs?.language;

      if (savedLang && ['en', 'hi', 'es'].includes(savedLang)) {
        return savedLang as SupportedLanguage;
      }
      return null;
    } catch (error) {
      console.error('Unexpected error loading language from Supabase:', error);
      return null;
    }
  };

  const saveLanguageToSupabase = async (userId: string, lang: SupportedLanguage): Promise<void> => {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('user_preferences')
        .select('ui_preferences')
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        if (selectError.code === 'PGRST301' || selectError.message?.includes('RLS')) {
          console.error('🔒 RLS Policy Error (SELECT): Cannot read user preferences. RLS policies may be missing.', selectError);
        } else {
          console.error('Error fetching existing preferences:', selectError);
        }
      }

      const existingPrefs = (existing?.ui_preferences as Record<string, any>) || {};

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ui_preferences: {
            ...existingPrefs,
            language: lang,
          },
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        if (upsertError.code === 'PGRST301' || upsertError.message?.includes('RLS') || upsertError.message?.includes('policy')) {
          console.error('🔒 RLS Policy Error (INSERT/UPDATE): Cannot save user preferences. RLS policies may be missing. Falling back to localStorage only.', upsertError);
        } else {
          console.error('Error saving language to Supabase:', upsertError);
        }
        console.warn('⚠️ Language preference saved to localStorage only due to Supabase error');
      } else {
        console.log('✅ Language preference saved to Supabase successfully');
      }
    } catch (error) {
      console.error('Unexpected error in saveLanguageToSupabase:', error);
      console.warn('⚠️ Language preference saved to localStorage only due to unexpected error');
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

      if (isAuthenticated && user?.id) {
        await saveLanguageToSupabase(user.id, lang);
      }

      setIsLoading(false);
      setTimeout(() => setIsTransitioning(false), 150);
    }, 150);
  };

  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);
      let langToLoad: SupportedLanguage = 'en';

      if (isAuthenticated && user?.id) {
        const supabaseLang = await loadLanguageFromSupabase(user.id);
        if (supabaseLang) {
          langToLoad = supabaseLang;
        } else {
          const localLang = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
          if (localLang && ['en', 'hi', 'es'].includes(localLang)) {
            langToLoad = localLang;
            await saveLanguageToSupabase(user.id, localLang);
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
