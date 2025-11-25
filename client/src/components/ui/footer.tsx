import { Link, useLocation } from "wouter";
import zyraLogo from "@assets/zyra logo_1759205684268.png";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const [location, setLocation] = useLocation();
  
  const navigationLinks = [
    { label: "About", href: "/about", testId: "link-footer-about", id: "about" },
    { label: "Privacy Policy", href: "/privacy-policy", testId: "link-footer-privacy", id: "privacy" },
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
      className={`bg-[#0e0e1e] border-t border-[#00F0FF]/20 mt-auto ${className}`}
      data-testid="footer-global"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {/* Powered by */}
            <div className="flex-shrink-0">
              <span
                className="text-[#EAEAEA] text-sm font-medium font-sans flex items-center gap-2"
                data-testid="text-powered-by"
              >
                Powered by Zyra AI
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Horizontal Compact */}
        <div className="md:hidden py-3 space-y-2">
          {/* Logo & Zyra AI Text */}
          <div className="text-center">
            <div
              onClick={handleLogoClick}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer group"
              data-testid="link-footer-logo-mobile"
            >
              <img 
                src={zyraLogo} 
                alt="Zyra AI Logo" 
                className="w-6 h-6 rounded-lg"
              />
              <span className="text-[#EAEAEA] group-hover:text-[#00F0FF] text-base font-bold font-sans transition-colors duration-300">
                Zyra AI
              </span>
            </div>
          </div>

          {/* All Footer Items - Single Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {/* About Link */}
            <Link href={navigationLinks[0].href}>
              <span
                className="text-[#EAEAEA] hover:text-[#00F0FF] font-medium font-sans px-2 py-1 rounded transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer"
                data-testid={`${navigationLinks[0].testId}-mobile`}
              >
                {navigationLinks[0].label}
              </span>
            </Link>

            <span className="text-[#00F0FF]/30">•</span>

            {/* Privacy Policy Link */}
            <Link href={navigationLinks[1].href}>
              <span
                className="text-[#EAEAEA] hover:text-[#00F0FF] font-medium font-sans px-2 py-1 rounded transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer"
                data-testid={`${navigationLinks[1].testId}-mobile`}
              >
                {navigationLinks[1].label}
              </span>
            </Link>

            <span className="text-[#00F0FF]/30">•</span>

            {/* Powered by */}
            <span
              className="text-[#EAEAEA] font-medium font-sans inline-flex items-center gap-1"
              data-testid="text-powered-by-mobile"
            >
              Powered by Zyra AI
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