import { Link, useLocation } from "wouter";
import { Shield, Lock } from "lucide-react";
import { SiLinkedin, SiInstagram, SiX } from "react-icons/si";
import zyraLogo from "@assets/zyra logo_1759205684268.png";
import { useAuth } from "@/hooks/useAuth";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Smart navigation: redirect to dashboard if authenticated, otherwise to landing page
  const homeHref = isAuthenticated ? "/dashboard" : "/";
  
  const companyLinks = [
    { label: "About", href: "/about", testId: "link-footer-about" },
    { label: "Contact", href: "/contact", testId: "link-footer-contact" },
  ];

  const resourceLinks = [
    { label: "Blog", href: "/blog", testId: "link-footer-blog" },
    { label: "Help Center", href: "/help", testId: "link-footer-help" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy-policy", testId: "link-footer-privacy" },
    { label: "Terms of Service", href: "/terms", testId: "link-footer-terms" },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location === homeHref) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLocation(homeHref);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <footer 
      className={`bg-[#16162c] border-t border-[#00F0FF]/20 mt-auto ${className}`}
      data-testid="footer-global"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:block py-8">
          <div className="grid grid-cols-4 gap-8 mb-8">
            {/* Logo & Brand */}
            <div>
              <div
                onClick={handleLogoClick}
                className="flex items-center gap-2.5 p-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#00F0FF]/10 cursor-pointer group w-fit"
                data-testid="link-footer-logo"
              >
                <img 
                  src={zyraLogo} 
                  alt="Zyra AI Logo" 
                  className="w-9 h-9 rounded-md flex-shrink-0"
                />
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-[#EAEAEA] group-hover:text-[#00F0FF] text-base font-bold font-sans transition-colors duration-300">
                    Zyra AI
                  </span>
                  <span className="text-[#EAEAEA]/50 text-[11px]">
                    AI-powered optimization
                  </span>
                </div>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-[#EAEAEA] font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span
                        className="text-[#EAEAEA]/70 hover:text-[#00F0FF] text-sm font-medium transition-colors duration-300 cursor-pointer"
                        data-testid={link.testId}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-[#EAEAEA] font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span
                        className="text-[#EAEAEA]/70 hover:text-[#00F0FF] text-sm font-medium transition-colors duration-300 cursor-pointer"
                        data-testid={link.testId}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-[#EAEAEA] font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span
                        className="text-[#EAEAEA]/70 hover:text-[#00F0FF] text-sm font-medium transition-colors duration-300 cursor-pointer"
                        data-testid={link.testId}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section with Copyright, Social Media, and Trust Badges */}
          <div className="border-t border-[#00F0FF]/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#EAEAEA]/60 text-sm" data-testid="text-copyright">
              © 2025 Zyra AI. All rights reserved.
            </p>
            {/* Social Media Icons - Center */}
            <div className="flex items-center gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#EAEAEA]/60 hover:text-[#00F0FF] transition-colors duration-300"
                data-testid="link-social-linkedin"
              >
                <SiLinkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#EAEAEA]/60 hover:text-[#00F0FF] transition-colors duration-300"
                data-testid="link-social-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#EAEAEA]/60 hover:text-[#00F0FF] transition-colors duration-300"
                data-testid="link-social-x"
              >
                <SiX className="w-5 h-5" />
              </a>
            </div>
            {/* Trust Badges - Right */}
            <div className="flex items-center gap-6 text-sm text-[#EAEAEA]/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00F0FF]" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#00F0FF]" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden py-6 space-y-6">
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

          {/* Links Grid - 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <h3 className="text-[#EAEAEA] font-semibold text-sm mb-3">Company</h3>
              <ul className="space-y-2">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span className="text-[#EAEAEA]/70 hover:text-[#00F0FF] text-xs transition-colors" data-testid={`${link.testId}-mobile`}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[#EAEAEA] font-semibold text-sm mb-3">Resources</h3>
              <ul className="space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span className="text-[#EAEAEA]/70 hover:text-[#00F0FF] text-xs transition-colors" data-testid={`${link.testId}-mobile`}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Legal Links - horizontal on mobile */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {legalLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-4">
                <Link href={link.href}>
                  <span className="text-[#EAEAEA]/70 hover:text-[#00F0FF] transition-colors" data-testid={`${link.testId}-mobile`}>
                    {link.label}
                  </span>
                </Link>
                {index < legalLinks.length - 1 && <span className="text-[#00F0FF]/30">•</span>}
              </span>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-[#EAEAEA]/60">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#00F0FF]" />
              <span>SOC 2</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#00F0FF]" />
              <span>GDPR</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-[#00F0FF]/20 pt-4">
            <p className="text-center text-[#EAEAEA]/60 text-xs" data-testid="text-copyright-mobile">
              © 2025 Zyra AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
