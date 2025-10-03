import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SupportedLanguage = 'en' | 'hi' | 'es';

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  es: '🇪🇸',
} as const;

const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  en: 'EN',
  hi: 'हिं',
  es: 'ES',
} as const;

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    await setLanguage(languageCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="button-language-switcher"
        aria-label="Select language"
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-transparent
          text-[#EAEAEA]
          border border-transparent
          transition-all duration-300 ease-in-out
          hover:text-[#00F0FF]
          hover:border-[#00F0FF]
          hover:bg-[#0D0D1F]
          data-[state=open]:bg-[#0D0D1F]
          data-[state=open]:border-[#00F0FF]
          focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 focus:ring-offset-transparent
        "
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">
          {LANGUAGE_FLAGS[currentLanguage]} {LANGUAGE_CODES[currentLanguage]}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          min-w-[200px]
          bg-[#0D0D1F]
          border border-[#00F0FF]
          shadow-[0_0_20px_rgba(0,240,255,0.3)]
          text-[#EAEAEA]
          p-1
          rounded-lg
        "
      >
        {availableLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            data-testid={`menu-language-${language.code}`}
            title={language.name}
            onSelect={() => handleLanguageChange(language.code)}
            className="
              flex items-center justify-between gap-3 px-3 py-2.5
              text-[#EAEAEA] text-sm
              rounded-md
              cursor-pointer
              transition-all duration-200
              hover:bg-[rgba(0,240,255,0.1)]
              hover:text-[#00F0FF]
              focus:bg-[rgba(0,240,255,0.1)]
              focus:text-[#00F0FF]
              focus:outline-none
            "
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{LANGUAGE_FLAGS[language.code]}</span>
              <span className="font-medium">{language.name}</span>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-[#00F0FF] flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1 bg-[rgba(0,240,255,0.2)]" />

        <DropdownMenuItem
          data-testid="menu-language-coming-soon"
          disabled
          className="
            flex items-center justify-between gap-3 px-3 py-2.5
            text-[#EAEAEA] text-sm
            rounded-md
            opacity-50
            cursor-not-allowed
          "
        >
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span className="font-medium">Coming Soon</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
