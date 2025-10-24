import { Link, useLocation } from "wouter";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/hooks/useLanguage';
import zyraLogo from "@assets/zyra logo_1759205684268.png";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  
  const navigationLinks = [
    { label: t('footer.about'), href: "/about", testId: "link-footer-about", id: "about" },
    { label: t('footer.privacyPolicy'), href: "/privacy-policy", testId: "link-footer-privacy", id: "privacy" },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location === '/dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLocation('/dashboard');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <footer 
      className={`bg-[#0B0B17] border-t border-[#00F0FF] mt-auto rounded-2xl ${className}`}
      data-testid="footer-global"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#0e0e1e] rounded-2xl">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between py-6">
          {/* Logo & Zyra AI Text - Left Side */}
          <div className="flex-shrink-0">
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer group"
              data-testid="link-footer-logo"
            >
              <img 
                src={zyraLogo} 
                alt="Zyra AI Logo" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-[#EAEAEA] group-hover:text-[#00F0FF] text-lg font-bold font-sans transition-colors duration-300">
                Zyra AI
              </span>
            </div>
          </div>

          {/* Center Links */}
          <div className="flex items-center gap-4">
            {/* About Link */}
            <Link href={navigationLinks[0].href}>
              <span
                className="text-[#EAEAEA] hover:text-[#00F0FF] text-sm font-medium font-sans px-3 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer"
                data-testid={navigationLinks[0].testId}
              >
                {navigationLinks[0].label}
              </span>
            </Link>

            {/* Privacy Policy Link */}
            <Link href={navigationLinks[1].href}>
              <span
                className="text-[#EAEAEA] hover:text-[#00F0FF] text-sm font-medium font-sans px-3 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer"
                data-testid={navigationLinks[1].testId}
              >
                {navigationLinks[1].label}
              </span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex-shrink-0">
              <LanguageSwitcher />
            </div>

            {/* Powered by */}
            <div className="flex-shrink-0">
              <span
                className="text-[#EAEAEA] text-sm font-medium font-sans flex items-center gap-2"
                data-testid="text-powered-by"
              >
                {t('footer.poweredBy')}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Stacked */}
        <div className="md:hidden py-6 space-y-4">
          {/* Logo & Zyra AI Text - Top */}
          <div className="text-center">
            <div
              onClick={handleLogoClick}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer group"
              data-testid="link-footer-logo-mobile"
            >
              <img 
                src={zyraLogo} 
                alt="Zyra AI Logo" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-[#EAEAEA] group-hover:text-[#00F0FF] text-lg font-bold font-sans transition-colors duration-300">
                Zyra AI
              </span>
            </div>
          </div>

          {/* About Link */}
          <div className="text-center">
            <Link href={navigationLinks[0].href}>
              <span
                className="text-[#EAEAEA] hover:text-[#00F0FF] text-sm font-medium font-sans py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 inline-block cursor-pointer"
                data-testid={`${navigationLinks[0].testId}-mobile`}
              >
                {navigationLinks[0].label}
              </span>
            </Link>
          </div>

          {/* Privacy Policy Link */}
          <div className="text-center">
            <Link href={navigationLinks[1].href}>
              <span
                className="text-[#EAEAEA] hover:text-[#00F0FF] text-sm font-medium font-sans py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 inline-block cursor-pointer"
                data-testid={`${navigationLinks[1].testId}-mobile`}
              >
                {navigationLinks[1].label}
              </span>
            </Link>
          </div>

          {/* Language Switcher */}
          <div className="text-center flex justify-center" data-testid="button-language-switcher-mobile">
            <LanguageSwitcher />
          </div>

          {/* Powered by */}
          <div className="text-center">
            <span
              className="text-[#EAEAEA] text-sm font-medium font-sans inline-flex items-center gap-2"
              data-testid="text-powered-by-mobile"
            >
              {t('footer.poweredBy')}
            </span>
          </div>
        </div>

        {/* Copyright - Bottom Center */}
        <div className="border-t border-[#00F0FF]/20 py-4">
          <p className="text-center text-[#EAEAEA]/60 text-sm font-sans" data-testid="text-copyright">
            © 2024 Zyra AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}