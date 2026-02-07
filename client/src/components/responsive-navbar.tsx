import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  disabled?: boolean;
}

interface ResponsiveNavbarProps {
  logo?: {
    icon?: React.ReactNode;
    text: string;
    href?: string;
  };
  navItems: NavItem[];
  actionButton?: {
    label: string;
    scrolledLabel?: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  scrollAware?: boolean;
  className?: string;
}

export default function ResponsiveNavbar({
  logo = {
    icon: <img src={zyraLogoUrl} alt="Zyra AI" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />,
    text: "Zyra AI",
    href: "/"
  },
  navItems,
  actionButton,
  secondaryAction,
  scrollAware = false,
  className
}: ResponsiveNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!scrollAware) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollAware]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    closeMenu();
  };

  const renderNavItem = (item: NavItem, index: number, isMobile: boolean = false) => {
    const baseClassName = cn(
      "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md font-medium",
      isMobile
        ? "block w-full text-left px-4 py-3 text-base text-foreground hover:text-primary hover:bg-muted"
        : "text-sm lg:text-base text-muted-foreground hover:text-foreground px-3 py-2 whitespace-nowrap",
      item.disabled ? "opacity-50 cursor-not-allowed" : ""
    );

    if (item.href) {
      if (item.external) {
        return (
          <a
            key={index}
            href={item.href}
            className={baseClassName}
            onClick={() => isMobile && closeMenu()}
            data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {item.label}
          </a>
        );
      } else {
        return (
          <Link
            key={index}
            href={item.href}
            className={baseClassName}
            onClick={() => isMobile && closeMenu()}
            data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {item.label}
          </Link>
        );
      }
    }

    if (item.onClick) {
      return (
        <button
          key={index}
          onClick={() => handleNavItemClick(item)}
          className={baseClassName}
          disabled={item.disabled}
          aria-disabled={item.disabled || undefined}
          data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {item.label}
        </button>
      );
    }

    return null;
  };

  const currentActionLabel = (scrollAware && isScrolled && actionButton?.scrolledLabel)
    ? actionButton.scrolledLabel
    : actionButton?.label || "";

  const renderActionButton = (isMobile: boolean = false) => {
    if (!actionButton) return null;

    if (actionButton.href) {
      return (
        <Button
          asChild
          className={cn(
            "gradient-button font-semibold tracking-wide whitespace-nowrap",
            isMobile ? "w-full text-base py-6" : "text-sm lg:text-base px-4 lg:px-6"
          )}
          data-testid={`action-button-${actionButton.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Link
            href={actionButton.href}
            onClick={() => isMobile && closeMenu()}
          >
            {isMobile ? actionButton.label : currentActionLabel}
          </Link>
        </Button>
      );
    }

    return (
      <Button
        className={cn(
          "gradient-button font-semibold tracking-wide whitespace-nowrap",
          isMobile ? "w-full text-base py-6" : "text-sm lg:text-base px-4 lg:px-6"
        )}
        onClick={() => {
          if (actionButton.onClick) {
            actionButton.onClick();
          }
          if (isMobile) {
            closeMenu();
          }
        }}
        data-testid={`action-button-${actionButton.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {isMobile ? actionButton.label : currentActionLabel}
      </Button>
    );
  };

  const renderSecondaryAction = (isMobile: boolean = false) => {
    if (!secondaryAction) return null;

    if (secondaryAction.href) {
      return (
        <Button
          asChild
          variant="outline"
          className={cn(
            "font-semibold tracking-wide border-primary/30 text-foreground/80",
            isMobile ? "w-full text-base py-6" : "text-sm lg:text-base"
          )}
          data-testid="button-nav-secondary"
        >
          <Link
            href={secondaryAction.href}
            onClick={() => isMobile && closeMenu()}
          >
            {secondaryAction.label}
          </Link>
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        className={cn(
          "font-semibold tracking-wide border-primary/30 text-foreground/80",
          isMobile ? "w-full text-base py-6" : "text-sm lg:text-base"
        )}
        onClick={() => {
          if (secondaryAction.onClick) secondaryAction.onClick();
          if (isMobile) closeMenu();
        }}
        data-testid="button-nav-secondary"
      >
        {secondaryAction.label}
      </Button>
    );
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 ease-in-out",
        scrollAware && isScrolled
          ? "py-2 px-4"
          : "bg-black/20 backdrop-blur-md border-b border-primary/20",
        className
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          scrollAware && isScrolled
            ? "max-w-5xl mx-auto rounded-2xl backdrop-blur-xl border border-primary/20 px-4 sm:px-6 py-2.5"
            : "container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4"
        )}
        style={scrollAware && isScrolled ? {
          background: 'rgba(10, 10, 26, 0.85)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 240, 255, 0.03)',
        } : {}}
      >
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {logo.href ? (
              <Link
                href={logo.href}
                className="flex items-center space-x-2 sm:space-x-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
                data-testid="nav-logo"
              >
                {logo.icon && (
                  <div className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    scrollAware && isScrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10 sm:w-12 sm:h-12"
                  )}>
                    {logo.icon}
                  </div>
                )}
                <span className={cn(
                  "font-bold text-foreground whitespace-nowrap transition-all duration-300",
                  scrollAware && isScrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl lg:text-2xl"
                )}>{logo.text}</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {logo.icon && (
                  <div className={cn(
                    "flex items-center justify-center transition-all duration-300",
                    scrollAware && isScrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10 sm:w-12 sm:h-12"
                  )}>
                    {logo.icon}
                  </div>
                )}
                <span className={cn(
                  "font-bold text-foreground whitespace-nowrap transition-all duration-300",
                  scrollAware && isScrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl lg:text-2xl"
                )}>{logo.text}</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 xl:gap-2 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item, index) => renderNavItem(item, index, false))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {renderSecondaryAction(false)}
              {renderActionButton(false)}
            </div>

            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="md:hidden text-foreground p-2 hover:bg-muted rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              data-testid="button-mobile-menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div
          ref={menuRef}
          id="mobile-menu"
          className={cn(
            "md:hidden fixed left-0 right-0 top-full bg-background/98 dark:bg-background/98 backdrop-blur-lg border-b border-primary/20 shadow-lg transition-all duration-300 ease-in-out",
            isOpen
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible -translate-y-2"
          )}
          role="menu"
          aria-labelledby="mobile-menu"
        >
          <div className="container mx-auto px-4 sm:px-6 py-6 space-y-1 bg-background">
            {navItems.map((item, index) => (
              <div key={index} role="menuitem">
                {renderNavItem(item, index, true)}
              </div>
            ))}
            {(secondaryAction || actionButton) && (
              <div className="pt-4 mt-2 border-t border-primary/20 space-y-3">
                {secondaryAction && renderSecondaryAction(true)}
                {renderActionButton(true)}
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
