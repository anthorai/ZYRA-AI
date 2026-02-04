import * as React from "react";
import {
  ArrowRight,
  BarChart,
  Menu,
  Zap,
  Activity,
  Search,
  ShoppingCart,
  Mail,
} from "lucide-react";
import { SiShopify } from "react-icons/si";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

interface NavigationItem {
  title: string;
  href: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

interface MynaHeroProps {
  navigationItems?: NavigationItem[];
  onLogout?: () => void;
  isAuthenticated?: boolean;
  isLoggingOut?: boolean;
}

const labels = [
  { icon: Search, label: "Product SEO" },
  { icon: ShoppingCart, label: "Cart Recovery" },
  { icon: Mail, label: "Smart Upsells" },
];

const features = [
  {
    icon: BarChart,
    label: "Revenue Attribution",
    description: "Track real revenue impact from every AI action ZYRA takes for your store.",
  },
  {
    icon: Zap,
    label: "Intelligent Automation",
    description: "Streamline your Shopify growth with AI-powered automation you can trust.",
  },
  {
    icon: Activity,
    label: "Real-time Insights",
    description: "Make informed decisions faster with live performance data and recommendations.",
  },
];

export function MynaHero({ 
  navigationItems = [],
}: MynaHeroProps) {
  const titleWords = [
    "LET",
    "AI",
    "RUN",
    "YOUR",
    "SHOPIFY",
    "GROWTH",
  ];

  const defaultNavItems: NavigationItem[] = [
    { title: "HOW IT WORKS", href: "#how-it-works", external: true },
    { title: "PRICING", href: "/pricing" },
    { title: "FAQ", href: "#faq", external: true },
  ];

  const navItems = navigationItems.length > 0 ? navigationItems : defaultNavItems;

  return (
    <div className="container mx-auto px-4 bg-background">
      <header>
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <img src={zyraLogoUrl} alt="ZYRA" className="h-8 w-8" />
              <span className="font-mono text-xl font-bold">ZYRA</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.title}
                  href={item.href}
                  className="text-sm font-mono text-foreground hover:text-primary transition-colors"
                >
                  {item.title}
                </a>
              ) : item.onClick ? (
                <button
                  key={item.title}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className="text-sm font-mono text-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  {item.title}
                </button>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className="text-sm font-mono text-foreground hover:text-primary transition-colors"
                >
                  {item.title}
                </Link>
              )
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              asChild
              variant="default"
              className="rounded-none hidden md:inline-flex font-mono"
              data-testid="button-header-start"
            >
              <Link href="/auth">
                GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col gap-6 mt-6">
                  {navItems.map((item) => (
                    item.external ? (
                      <a
                        key={item.title}
                        href={item.href}
                        className="text-sm font-mono text-foreground hover:text-primary transition-colors"
                      >
                        {item.title}
                      </a>
                    ) : item.onClick ? (
                      <button
                        key={item.title}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className="text-sm font-mono text-foreground hover:text-primary transition-colors text-left disabled:opacity-50"
                      >
                        {item.title}
                      </button>
                    ) : (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="text-sm font-mono text-foreground hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                    )
                  ))}
                  <Button 
                    asChild
                    className="cursor-pointer rounded-none font-mono"
                    data-testid="button-mobile-start"
                  >
                    <Link href="/auth">
                      GET STARTED <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-24">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
            >
              <SiShopify className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono">Built for Shopify stores</span>
            </motion.div>

            <motion.h1
              initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative font-mono text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight"
            >
              {titleWords.map((text, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.15, 
                    duration: 0.6 
                  }}
                  className={`inline-block mx-2 md:mx-4 ${text === "SHOPIFY" || text === "GROWTH" ? "text-primary" : ""}`}
                >
                  {text}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mx-auto mt-8 max-w-2xl text-xl text-muted-foreground font-mono"
            >
              ZYRA automatically detects, fixes, and proves what's blocking your store's revenue — 
              with full control.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="mt-12 flex flex-wrap justify-center gap-6"
            >
              {labels.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 1.8 + (index * 0.15), 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10
                  }}
                  className="flex items-center gap-2 px-6"
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-mono">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 2.4, 
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
              className="flex flex-col sm:flex-row gap-4 mt-12"
            >
              <Button
                asChild
                size="lg"
                className="cursor-pointer rounded-none font-mono"
                data-testid="button-hero-start"
              >
                <Link href="/auth">
                  START FREE <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="container pb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 3.0, 
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
            className="text-center text-3xl sm:text-4xl font-mono font-bold mb-6"
          >
            Unlock the Power of AI for Your Store
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2, duration: 0.6 }}
            className="grid md:grid-cols-3 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 3.2 + (index * 0.2), 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                  damping: 10
                }}
                className="flex flex-col items-center text-center p-8 bg-background border"
              >
                <div className="mb-6 rounded-full bg-primary/10 p-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-xl font-mono font-bold">
                  {feature.label}
                </h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
