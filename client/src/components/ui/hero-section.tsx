import * as React from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { SiShopify } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { cn } from "@/lib/utils";
import zyraLogoUrl from "@assets/zyra logo_1758694880266.png";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

interface NavigationItem {
  name: string;
  href: string;
  external?: boolean;
  onClick?: () => void;
}

interface HeroSectionProps {
  navigationItems?: NavigationItem[];
}

export function HeroSection({ navigationItems }: HeroSectionProps) {
  return (
    <>
      <HeroHeader navigationItems={navigationItems} />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
        >
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(180,100%,50%,.08)_0,hsla(180,100%,50%,.02)_50%,hsla(180,100%,50%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(180,100%,50%,.06)_0,hsla(180,100%,50%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(180,100%,50%,.04)_0,hsla(180,100%,50%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <a
                    href="#how-it-works"
                    className="bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                  >
                    <SiShopify className="w-4 h-4 text-primary" />
                    <span className="text-foreground text-sm font-mono">
                      Built for Shopify stores
                    </span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
                    <div className="bg-background size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </a>

                  <div className="mt-8 max-w-4xl mx-auto lg:mt-16">
                    <TypewriterEffectSmooth
                      words={[
                        { text: "LET", className: "text-foreground font-mono" },
                        { text: "AI", className: "text-foreground font-mono" },
                        { text: "RUN", className: "text-foreground font-mono" },
                        { text: "YOUR", className: "text-foreground font-mono" },
                        { text: "SHOPIFY", className: "text-primary font-mono" },
                        { text: "GROWTH", className: "text-primary font-mono" },
                      ]}
                      className="justify-center"
                      cursorClassName="bg-primary"
                    />
                  </div>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground font-mono">
                    ZYRA automatically detects, fixes, and proves what's
                    blocking your store's revenue — with full control.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div className="bg-foreground/10 rounded-[14px] border p-0.5">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base font-mono"
                      data-testid="button-hero-start"
                    >
                      <Link href="/auth">
                        <span className="text-nowrap">Start Free</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="rounded-xl px-5 font-mono"
                    data-testid="button-hero-demo"
                  >
                    <a href="#how-it-works">
                      <span className="text-nowrap">See How It Works</span>
                    </a>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative mt-8 overflow-hidden px-2 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1 ring-background dark:shadow-none">
                  <div className="aspect-video relative rounded-2xl bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-full px-6 py-3 mb-6">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-mono text-primary">
                          ZYRA Engine Active
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-mono font-bold mb-4">
                        Revenue Protection Dashboard
                      </h3>
                      <p className="text-muted-foreground font-mono max-w-lg mx-auto">
                        Watch ZYRA detect friction, apply fixes, and prove
                        revenue impact in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        <section className="bg-background pb-16 pt-16 md:pb-32">
          <div className="group relative m-auto max-w-5xl px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <a
                href="#testimonials"
                className="block text-sm duration-150 font-mono"
              >
                <span>See What Stores Are Saying</span>
                <ChevronRight className="ml-1 inline-block size-3" />
              </a>
            </div>
            <h3 className="text-center text-sm font-mono text-muted-foreground mb-8">
              Trusted by Shopify stores worldwide
            </h3>
            <div className="group-hover:blur-xs mx-auto grid max-w-3xl grid-cols-3 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">S1</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    Store #1
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">S2</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    Store #2
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">S3</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    Store #3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const defaultMenuItems: NavigationItem[] = [
  { name: "HOW IT WORKS", href: "#how-it-works", external: true },
  { name: "PRICING", href: "/pricing" },
  { name: "FAQ", href: "#faq", external: true },
];

interface HeroHeaderProps {
  navigationItems?: NavigationItem[];
}

const HeroHeader = ({ navigationItems }: HeroHeaderProps) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const menuItems = navigationItems || defaultMenuItems;

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-20 w-full px-2 group">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-2 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <img src={zyraLogoUrl} alt="ZYRA" className="h-8 w-8" />
                <span className="font-mono text-xl font-bold">ZYRA</span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                data-testid="button-mobile-menu"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    {item.external ? (
                      <a
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground block duration-150 font-mono"
                      >
                        <span>{item.name}</span>
                      </a>
                    ) : item.onClick ? (
                      <button
                        onClick={item.onClick}
                        className="text-muted-foreground hover:text-foreground block duration-150 font-mono"
                      >
                        <span>{item.name}</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground block duration-150 font-mono"
                      >
                        <span>{item.name}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      {item.external ? (
                        <a
                          href={item.href}
                          className="text-muted-foreground hover:text-foreground block duration-150 font-mono"
                        >
                          <span>{item.name}</span>
                        </a>
                      ) : item.onClick ? (
                        <button
                          onClick={item.onClick}
                          className="text-muted-foreground hover:text-foreground block duration-150 font-mono text-left"
                        >
                          <span>{item.name}</span>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-foreground block duration-150 font-mono"
                        >
                          <span>{item.name}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn("font-mono", isScrolled && "lg:hidden")}
                  data-testid="button-header-login"
                >
                  <Link href="/auth">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn("font-mono", isScrolled && "lg:hidden")}
                  data-testid="button-header-signup"
                >
                  <Link href="/auth">
                    <span>Sign Up</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn("font-mono", isScrolled ? "lg:inline-flex" : "hidden")}
                  data-testid="button-header-start"
                >
                  <Link href="/auth">
                    <span>Get Started</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
