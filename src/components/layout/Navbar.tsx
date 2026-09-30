// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { EASE_BRAND } from "@/lib/motion";
import {
  User,
  Menu,
  X,
  Home,
  ShoppingBag,
  MapPin,
  ChevronDown,
  ChevronRight,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { trackWhatsappClick } from "@/lib/analytics";
import { openB2bRegisterModal } from "@/lib/b2b/registerModal";
import { occasionIcon } from "@/components/icons/occasion";

// Submenu motion (Tours, Offers) — the panel eases down from just under "Tours" while
// its items fade in with a short stagger; closing is quicker and has no stagger.
const submenuPanel: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: EASE_BRAND, staggerChildren: 0.035, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.14, ease: "easeIn" } },
};
const submenuItem: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.18, ease: EASE_BRAND } },
};
// Mobile accordion — height animates open/closed on the same brand curve.
const mobileSubmenu: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.28, ease: EASE_BRAND, staggerChildren: 0.04, delayChildren: 0.06 },
  },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: EASE_BRAND } },
};

/** A live Tour Collection (published, ≥1 published tour) for the Tours dropdown. */
export interface NavTourCollection {
  name: string;
  slug: string;
}

/** A published Occasion Offer page for the Offers dropdown. */
export interface NavOccasionOffer {
  name: string;
  slug: string;
  /** Picks the item's icon (diya for Diwali, …) — see src/components/icons/occasion.tsx. */
  occasionType: string;
}

type NavIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

/** A top-level nav item's dropdown (desktop panel + mobile accordion). */
interface NavMenu {
  id: string;
  heading: string;
  /** aria-label of the chevron / trigger button. */
  toggleLabel: string;
  Icon: NavIcon;
  /** An item's own Icon overrides the menu's. */
  items: { href: string; label: string; Icon?: NavIcon }[];
}

interface NavLinkItem {
  href: string;
  label: string;
  menu?: NavMenu;
  /** Small attention tag on the item, e.g. "NEW" on Offers. */
  badge?: string;
}

/** Blinking corner tag ("NEW") — still for reduced-motion users. */
function NavBadge({ label, inline = false }: { label: string; inline?: boolean }) {
  return (
    <span
      className={
        inline
          ? "relative ml-2 inline-flex items-center align-middle"
          : "pointer-events-none absolute -right-6 -top-3 inline-flex"
      }
    >
      <span className="absolute inset-0 rounded-full bg-red-500 opacity-60 motion-safe:animate-ping" />
      <span className="relative rounded-full bg-red-500 px-1.5 py-[1px] text-[9px] font-extrabold uppercase leading-[14px] tracking-wider text-white shadow motion-safe:animate-pulse">
        {label}
      </span>
    </span>
  );
}

export function Navbar({
  tourCollections = [],
  occasionOffers = [],
}: {
  tourCollections?: NavTourCollection[];
  occasionOffers?: NavOccasionOffer[];
}) {
  const { siteName } = useSiteSettings();
  const wa = useWhatsAppLink();
  const planTripHref = wa(
    `Hi ${siteName}! I'd like to plan my Kashmir trip. Please help me build a custom itinerary.`,
  );
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Dropdown submenus (Tours, Offers) — desktop panel and mobile accordion,
  // both fed by the same navLinks[].menu below so they can never disagree.
  // At most one open at a time, keyed by NavMenu.id.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpenMenu, setMobileOpenMenu] = useState<string | null>(null);
  // Hover intent: a short close delay so moving the pointer from the trigger
  // into the panel (or brushing past its edge) never makes it flicker shut.
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenuNow = (id: string) => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    setOpenMenu(id);
  };
  const closeMenuSoon = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };
  useEffect(
    () => () => {
      if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    },
    [],
  );
  // Whether a sticky BannerStrip currently occupies the top of the viewport. The
  // navbar drops below it by the strip's height (top-9 / top-10) when present.
  const [stripVisible, setStripVisible] = useState(false);
  const pathname = usePathname();

  // Switches to the opaque pill just 40px into the scroll, on every
  // viewport, so it doesn't linger transparent over hero content underneath.
  useEffect(() => {
    const threshold = 40;
    const handleScroll = () => setScrolled(window.scrollY > threshold);

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  // Sync with the BannerStrip: seed from the DOM on mount (the strip may already
  // be rendered), then follow its show/dismiss events.
  useEffect(() => {
    setStripVisible(!!document.getElementById("vk-strip"));
    const onStrip = (e: Event) =>
      setStripVisible(Boolean((e as CustomEvent<{ visible: boolean }>).detail?.visible));
    window.addEventListener("vk-strip", onStrip);
    return () => window.removeEventListener("vk-strip", onStrip);
  }, []);

  // Close mobile menu (and any submenu) when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMenu(null);
    setMobileOpenMenu(null);
  }, [pathname]);

  // "Tours" itself links to /tours (all tours); its submenu lists each live
  // Tour Collection in admin sort order. "Offers" links to the /offers hub and
  // lists each published Occasion Offer; it's left out while none are published.
  const toursMenu: NavMenu | undefined = tourCollections.length
    ? {
        id: "tours",
        heading: "Tour Packages",
        toggleLabel: "Show tour packages",
        Icon: Mountain,
        items: tourCollections.map((c) => ({ href: `/${c.slug}`, label: c.name })),
      }
    : undefined;
  const offersMenu: NavMenu | undefined = occasionOffers.length
    ? {
        id: "offers",
        heading: "Seasonal Offers",
        toggleLabel: "Show offers",
        Icon: occasionIcon("OTHER"),
        items: occasionOffers.map((o) => ({
          href: `/offers/${o.slug}`,
          label: o.name,
          Icon: occasionIcon(o.occasionType),
        })),
      }
    : undefined;

  const navLinks: NavLinkItem[] = [
    { href: "/tours", label: "Tours", menu: toursMenu },
    // Distinct label from the header's own "Plan My Trip" WhatsApp button
    // (see planTripHref below) — that opens WhatsApp directly; this links to
    // the Plan Your Kashmir Trip page. Same label, two different actions
    // would be confusing, so deliberately worded differently.
    { href: "/plan-your-kashmir-trip", label: "Trip Planner" },
    { href: "/destinations", label: "Destinations" },
    ...(offersMenu ? [{ href: "/offers", label: "Offers", menu: offersMenu, badge: "New" }] : []),
    { href: "/blog", label: "Travel Stories" },
    { href: "/reviews", label: "Reviews" },
  ];

  const bottomNavLinks: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/tours", label: "Tours", Icon: ShoppingBag },
    { href: "/destinations", label: "Destinations", Icon: MapPin },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    // The Tours parent is also "current" on any Tour Collection page.
    if (path === "/tours" && tourCollections.some((c) => pathname === `/${c.slug}`)) return true;
    return pathname.startsWith(path);
  };
  // A menu parent is also current on any of its menu's pages.
  const isLinkActive = (link: NavLinkItem) =>
    isActive(link.href) || !!link.menu?.items.some((i) => i.href === pathname);

  // Pages that open with a full-bleed dark hero behind the navbar. Only on these
  // does the un-scrolled navbar go transparent with a white lockup; everywhere
  // else (booking, legal, etc.) it keeps the cream glass + ink/theme-aware logo.
  const heroRoutes = [
    "/",
    "/tours",
    "/adventures",
    "/destinations",
    "/activities",
    "/about",
    "/blog",
    "/contact",
    "/reviews",
    "/offers",
  ];
  const hasHero =
    heroRoutes.includes(pathname) ||
    /^\/(tours|destinations|blog|activities|offers)\/[^/]+$/.test(pathname);
  const overHero = hasHero && !scrolled;

  // On a tour detail page the sticky Book / Inquiry CTA bar (BookingMobileBar)
  // owns the bottom of the screen on phones, so we hide the global bottom tab
  // bar there to keep those CTAs visible and uncluttered.
  const isTourDetail = /^\/tours\/[^/]+$/.test(pathname);
  // Same on an Occasion Offer page, whose own sticky CTA bar (OfferMobileBar)
  // sits at the bottom of the screen.
  const isOfferPage = /^\/offers\/[^/]+$/.test(pathname);

  // On the B2B page, the header's primary right-side CTA switches from the
  // consumer "Plan My Trip" WhatsApp action to opening the B2B registration
  // modal — every other route keeps "Plan My Trip" unchanged.
  const isB2bPage = pathname === "/b2b-travel-partner-program";

  return (
    <>
      <header
        className={`fixed inset-x-0 z-50 px-3 transition-all duration-500 sm:px-4 lg:px-0 ${
          stripVisible ? "top-8" : "top-0"
        }`}
      >
        <nav
          className={`mx-auto mt-4 flex max-w-[1300px] items-center justify-between rounded-2xl px-4 py-3 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-[250ms] ease-brand motion-reduce:transition-none sm:px-5 lg:px-6 ${
            overHero ? "bg-transparent" : "nav-pill-solid"
          }`}
        >
          {/* Logo — white lockup over the hero photo (transparent state), then
              theme-aware (navy on cream / white in dark) once the cream nav lands. */}
          <Logo variant={overHero ? "light" : "auto"} className="h-8" />

          {/* Desktop Navigation — light-on-dark over the hero, ink once landed. */}
          <ul
            className={`hidden items-center gap-7 text-[16px] font-semibold lg:flex ${
              overHero ? "text-white/80" : "text-foreground/75"
            }`}
          >
            {navLinks.map((link) => {
              const menu = link.menu;
              const active = isLinkActive(link);
              const linkCls = `relative transition ${
                overHero
                  ? active
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                  : active
                    ? "text-foreground"
                    : "text-foreground/75 hover:text-foreground"
              }`;
              const underline = active && (
                <span
                  className={`absolute -bottom-1.5 left-0 h-[2px] w-full rounded-full ${
                    overHero ? "bg-white" : "bg-primary"
                  }`}
                />
              );
              if (!menu) {
                return (
                  <li key={link.label}>
                    <Link href={link.href} className={linkCls}>
                      {link.label}
                      {underline}
                      {link.badge && <NavBadge label={link.badge} />}
                    </Link>
                  </li>
                );
              }
              const isOpen = openMenu === menu.id;
              const chevron = (
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
                  strokeWidth={2.2}
                />
              );
              return (
                <li
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => openMenuNow(menu.id)}
                  onMouseLeave={closeMenuSoon}
                  onKeyDown={(e) => e.key === "Escape" && setOpenMenu(null)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                      setOpenMenu(null);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Link href={link.href} className={linkCls}>
                      {link.label}
                      {underline}
                      {link.badge && <NavBadge label={link.badge} />}
                    </Link>
                    <button
                      type="button"
                      aria-label={menu.toggleLabel}
                      aria-expanded={isOpen}
                      aria-controls={`nav-${menu.id}-menu`}
                      onClick={() => setOpenMenu(isOpen ? null : menu.id)}
                      className={`grid h-6 w-6 place-items-center rounded-full transition ${
                        overHero
                          ? "text-white/80 hover:text-white"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {chevron}
                    </button>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      // Anchored to the left edge of the trigger, directly
                      // beneath it. pt-4 is an invisible hover bridge between
                      // trigger and panel so the pointer can travel down
                      // without the menu closing.
                      <motion.div
                        variants={submenuPanel}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ transformOrigin: "top left" }}
                        className="absolute left-0 top-full z-50 pt-4"
                      >
                        {/* Pointer notch aimed at the trigger. */}
                        <span
                          aria-hidden
                          className="absolute left-7 top-[11px] h-3 w-3 rotate-45 rounded-[3px] border-l border-t border-border bg-card"
                        />
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 backdrop-blur-2xl">
                          {/* Soft brand glow along the top edge. */}
                          <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                          />
                          <p className="px-5 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            {menu.heading}
                          </p>
                          {/* Sized to its longest item (min 300px), capped to the viewport. */}
                          <ul
                            id={`nav-${menu.id}-menu`}
                            className="w-max min-w-[300px] max-w-[min(92vw,480px)] p-2.5 pt-1"
                          >
                            {menu.items.map((item) => {
                              const current = pathname === item.href;
                              const ItemIcon = item.Icon ?? menu.Icon;
                              return (
                                <motion.li key={item.href} variants={submenuItem}>
                                  <Link
                                    href={item.href}
                                    onClick={() => setOpenMenu(null)}
                                    aria-current={current ? "page" : undefined}
                                    className={`group relative flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3.5 transition-colors duration-200 ${
                                      current ? "bg-primary/10" : "hover:bg-muted/70"
                                    }`}
                                  >
                                    {/* Current-page accent bar */}
                                    {current && (
                                      <span
                                        aria-hidden
                                        className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary"
                                      />
                                    )}
                                    <span
                                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-all duration-300 ease-out group-hover:scale-105 ${
                                        current
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                      }`}
                                    >
                                      <ItemIcon className="h-[18px] w-[18px]" strokeWidth={2} />
                                    </span>
                                    <span
                                      className={`min-w-0 flex-1 text-[14px] font-semibold leading-snug transition-colors duration-200 ${
                                        current
                                          ? "text-primary"
                                          : "text-foreground/85 group-hover:text-foreground"
                                      }`}
                                    >
                                      {item.label}
                                    </span>
                                    <ChevronRight
                                      className={`h-4 w-4 shrink-0 transition-all duration-300 ease-out ${
                                        current
                                          ? "translate-x-0 text-primary opacity-100"
                                          : "-translate-x-2 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                      }`}
                                      strokeWidth={2.4}
                                    />
                                  </Link>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle
              className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                overHero
                  ? "border-white/30 text-white hover:bg-white hover:text-foreground"
                  : "border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
              }`}
            />
            <Link
              href="/login"
              aria-label="Log in to your account"
              className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                overHero
                  ? "border-white/30 text-white hover:bg-white hover:text-foreground"
                  : "border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <User className="h-4 w-4" strokeWidth={2} />
            </Link>
            {isB2bPage ? (
              <button
                type="button"
                onClick={openB2bRegisterModal}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
              >
                Register as B2B Partner
              </button>
            ) : (
              <Link
                href={planTripHref}
                target="_blank"
                onClick={() => trackWhatsappClick("header")}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Plan My Trip
              </Link>
            )}
          </div>

          {/* Mobile Top Bar - Only Theme Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Tab Bar — hidden on tour detail pages where the sticky
          Book / Inquiry CTA bar takes over the bottom of the screen. */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden ${isTourDetail || isOfferPage ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-around py-2">
          {bottomNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition ${
                isActive(link.href) ? "text-primary" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <link.Icon className="h-5 w-5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          ))}

          {/* User Icon - Added before burger menu */}
          <Link
            href="/login"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition ${
              pathname === "/login" ? "text-primary" : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <User className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>

          {/* Burger Menu - Opens overlay */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition ${
              mobileMenuOpen ? "text-primary" : "text-foreground/60 hover:text-foreground"
            }`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            )}
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Floating Action Button - Plan Trip (Mobile - Always Visible) */}
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.5,
        }}
        // Hidden on offer pages — OfferMobileBar carries the CTA + WhatsApp there.
        className={`fixed bottom-20 right-4 z-50 lg:hidden ${isOfferPage ? "hidden" : ""}`}
      >
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {isB2bPage ? (
            <button
              type="button"
              onClick={openB2bRegisterModal}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 shadow-xl ring-inner transition hover:brightness-110"
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              <span className="text-sm font-bold text-primary-foreground">
                Register as B2B Partner
              </span>

              {/* Pulse ring animation */}
              <motion.span
                className="absolute inset-0 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "9999px",
                }}
              />
            </button>
          ) : (
            <Link
              href={planTripHref}
              target="_blank"
              onClick={() => trackWhatsappClick("header_mobile")}
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 shadow-xl ring-inner transition hover:brightness-110"
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <WhatsAppIcon className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-bold text-primary-foreground">Plan My Trip</span>

              {/* Pulse ring animation */}
              <motion.span
                className="absolute inset-0 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "9999px",
                }}
              />
            </Link>
          )}
        </motion.div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-background/95 backdrop-blur-lg lg:hidden"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              // min-h-full (not h-full) + overflow-y-auto above: when the Tours
              // submenu is expanded on a short phone, the menu scrolls instead
              // of clipping; pb clears the fixed bottom tab bar.
              className="flex min-h-full flex-col items-center justify-center gap-6 px-4 pb-28 pt-10"
            >
              {navLinks.map((link, index) => {
                const menu = link.menu;
                const active = isLinkActive(link);
                const labelCls = `text-[18px] font-medium transition hover:text-primary ${
                  active ? "text-primary" : "text-foreground/80"
                }`;
                const isOpen = !!menu && mobileOpenMenu === menu.id;
                const toggle = () => menu && setMobileOpenMenu(isOpen ? null : menu.id);
                return (
                  <motion.div
                    key={link.label}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex w-full flex-col items-center"
                  >
                    {menu ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Link
                            href={link.href}
                            className={labelCls}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                            {link.badge && <NavBadge label={link.badge} inline />}
                          </Link>
                          <button
                            type="button"
                            aria-label={menu.toggleLabel}
                            aria-expanded={isOpen}
                            aria-controls={`mobile-${menu.id}-menu`}
                            onClick={toggle}
                            className="grid h-8 w-8 place-items-center rounded-full text-foreground/70 transition hover:bg-muted hover:text-foreground"
                          >
                            <ChevronDown
                              className={`h-5 w-5 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            // Height animates on this padding-free wrapper; the
                            // spacing lives on the inner list so the open/close
                            // motion never jumps at its start or end.
                            <motion.div
                              id={`mobile-${menu.id}-menu`}
                              variants={mobileSubmenu}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="w-full max-w-xs overflow-hidden"
                            >
                              <ul className="mt-3 flex flex-col gap-1 rounded-2xl border border-border bg-card/80 p-2 text-center">
                                {menu.items.map((item) => (
                                  <motion.li key={item.href} variants={submenuItem}>
                                    <Link
                                      href={item.href}
                                      onClick={() => setMobileMenuOpen(false)}
                                      aria-current={pathname === item.href ? "page" : undefined}
                                      className={`block break-words rounded-xl px-3 py-2.5 text-[15px] transition-colors duration-200 ${
                                        pathname === item.href
                                          ? "bg-primary/10 font-semibold text-primary"
                                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                                      }`}
                                    >
                                      {item.label}
                                    </Link>
                                  </motion.li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={link.href}
                        className={labelCls}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
