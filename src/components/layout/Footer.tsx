"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import type { TourCategory } from "@prisma/client";
import { Logo } from "@/components/brand/Logo";
import { InstagramIcon, FacebookIcon, YoutubeIcon, WhatsAppIcon } from "@/components/icons/brand";
import { trackWhatsappClick, trackPhoneClick, trackEmailClick } from "@/lib/analytics";
import { formatBusinessAddress } from "@/lib/businessAddress";
import { TOUR_CATEGORY_META } from "@/lib/tours/categories";

// The three category sitelinks we actively want Google to pick up. Rendered
// only if that category actually has a published tour (checked via
// `tourCategories`, passed down from the public layout) — never links to a
// page that would 404.
const PRIORITY_CATEGORIES: TourCategory[] = ["HONEYMOON", "FAMILY", "GROUP"];

export interface FooterSettings {
  siteName: string;
  siteTagline: string | null;
  siteEmail: string | null;
  sitePhone: string | null;
  siteAddress: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  googleReviews?: string | null;
  tripadvisor?: string | null;
  legalName?: string | null;
  tourismRegNumber?: string | null;
  gstNumber?: string | null;
  addressLine1?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPincode?: string | null;
  addressCountry?: string | null;
}

export function Footer({
  settings,
  tourCategories = [],
}: {
  settings?: FooterSettings | null;
  tourCategories?: TourCategory[];
}) {
  const priorityCategoryLinks = PRIORITY_CATEGORIES.filter((c) => tourCategories.includes(c));
  const siteName = settings?.siteName ?? "Vertex Kashmir Holidays";
  const phone = settings?.sitePhone ?? "+91 99999 00000";
  const email = settings?.siteEmail ?? "hello@vertexkashmir.com";
  const address =
    formatBusinessAddress(settings) ??
    settings?.siteAddress ??
    "Katipora, Tangmarg, Baramulla, Jammu & Kashmir 193402, India";

  // Build a WhatsApp click-to-chat link from the settings number (whatsapp →
  // phone fallback), with a context-appropriate prefilled message.
  const waDigits = (settings?.whatsapp || settings?.sitePhone || "").replace(/[^0-9]/g, "");
  const wa = (message: string) =>
    waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}` : "/contact";

  const planTripHref = wa(
    `Hi ${siteName}! I'd like to plan my Kashmir trip. Please share a handcrafted itinerary.`,
  );
  const whatsappChatHref = wa(`Hi ${siteName}! I have a question about your Kashmir tours.`);

  return (
    <footer className="relative z-[2] mt-16">
      <div className="mx-auto max-w-[1300px] px-6">
        <div className="sweep glass-strong relative overflow-hidden rounded-4xl p-10 text-center shadow-glass">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl"></div>
          <div aria-hidden className="orb orb-gold absolute -right-16 -bottom-16 h-64 w-64"></div>
          <h2 className="rv h-display text-4xl font-bold text-foreground">
            Ready to step <span className="grad-text-cool italic">through the portal?</span>
          </h2>
          <p
            className="rv mt-3 text-sm text-muted-foreground"
            style={{ "--rd": "0.08s" } as React.CSSProperties}
          >
            Tell us your dates — get a handcrafted itinerary on WhatsApp within the hour.
          </p>
          <div
            className="rv mt-7 flex flex-wrap justify-center gap-3"
            style={{ "--rd": "0.16s" } as React.CSSProperties}
          >
            <a
              href={planTripHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsappClick("footer_cta")}
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:scale-[1.03]"
            >
              Plan My Trip Free →
            </a>
            <Link
              href="/tours"
              className="glass rounded-full px-8 py-3.5 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
            >
              Browse Packages
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-border bg-card/60 backdrop-blur">
        <div className="mx-auto grid max-w-[1300px] gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="auto" href="/" className="h-9" />
            {(settings?.tourismRegNumber || settings?.gstNumber) && (
              <ul className="mt-2.5 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">
                {settings?.tourismRegNumber && <li>Reg.: {settings.tourismRegNumber}</li>}
                {settings?.gstNumber && <li>GSTIN: {settings.gstNumber}</li>}
              </ul>
            )}
            <div className="mt-5 flex gap-2.5">
              {settings?.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
                >
                  <InstagramIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings?.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
                >
                  <FacebookIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings?.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
                >
                  <YoutubeIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              <a
                href={whatsappChatHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                onClick={() => trackWhatsappClick("footer_social")}
                className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10"
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
            </div>
            {(settings?.googleReviews || settings?.tripadvisor) && (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {settings?.googleReviews && (
                  <a
                    href={settings.googleReviews}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                        fill="url(#gLogoFooter)"
                        opacity=".5"
                      />
                      <defs>
                        <linearGradient id="gLogoFooter" x1="2" y1="2" x2="22" y2="22">
                          <stop stopColor="#EA4335" />
                          <stop offset=".5" stopColor="#FBBC04" />
                          <stop offset="1" stopColor="#34A853" />
                        </linearGradient>
                      </defs>
                    </svg>
                    Google Reviews
                  </a>
                )}
                {settings?.tripadvisor && (
                  <a
                    href={settings.tripadvisor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:border-[#34E0A1] hover:text-[#00aa6c]"
                  >
                    <svg
                      className="h-3.5 w-3.5 text-[#00aa6c]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 4a6 6 0 1 1 0 12A6 6 0 0 1 12 6zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                    </svg>
                    Tripadvisor
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10">
              <div>
                <p className="text-sm font-bold text-foreground">Explore</p>
                <ul className="mt-4 space-y-2.5 text-[14px] text-muted-foreground">
                  {priorityCategoryLinks.map((c) => (
                    <li key={c}>
                      <Link
                        href={`/tours/category/${TOUR_CATEGORY_META[c].slug}`}
                        className="transition hover:text-primary"
                      >
                        {TOUR_CATEGORY_META[c].pageTitle}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/tours/category" className="transition hover:text-primary">
                      All Tour Categories
                    </Link>
                  </li>
                  <li>
                    <Link href="/destinations" className="transition hover:text-primary">
                      Destinations
                    </Link>
                  </li>
                  <li>
                    {/* Plain <a>, not next/link — /reviews embeds TripAdvisor's widget
                       script, which only reliably initializes on a fresh page load,
                       not a client-side (SPA) transition. */}
                    <Link href="/reviews" className="transition hover:text-primary">
                      Customer Reviews
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Legals</p>
                <ul className="mt-4 space-y-2.5 text-[14px] text-muted-foreground">
                  <li>
                    <Link href="/about" className="transition hover:text-primary">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="transition hover:text-primary">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-and-cancellation" className="transition hover:text-primary">
                      Refund &amp; Cancellation
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-and-conditions" className="transition hover:text-primary">
                      Terms &amp; Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="transition hover:text-primary">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="transition hover:text-primary">
                      FAQs
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            {/* Theme-matched pair, same block/hidden dark: pattern as <Logo variant="auto">.
               The inactive variant is display:none from first paint, so — unlike
               `priority` — the browser never fetches it unless the theme is
               actually toggled live; neither carries `priority` since this is
               below-the-fold footer content, not LCP-critical. */}
            <Image
              src="/gateway/payment-partner-light.webp"
              alt="Payment processing partner — Razorpay, and accepted cards/wallets"
              width={1536}
              height={1024}
              className="mt-8 block h-24 w-full object-contain dark:hidden sm:h-28"
            />
            <Image
              src="/gateway/payment-partner-dark.webp"
              alt="Payment processing partner — Razorpay, and accepted cards/wallets"
              width={1536}
              height={1024}
              className="mt-8 hidden h-24 w-full object-contain dark:block sm:h-28"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Company</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-muted-foreground">
              <li>
                <Link href="/blog" className="transition hover:text-primary">
                  Travel Stories
                </Link>
              </li>
              <li>
                <Link href="/adventures" className="transition hover:text-primary">
                  Adventures
                </Link>
              </li>
              <li>
                <Link href="/careers" className="transition hover:text-primary">
                  Careers
                </Link>
              </li>
            </ul>
            <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground">
              <MapPin className="mr-1 inline h-3.5 w-3.5 -translate-y-px" /> {address}
              <br />
              <Phone className="mr-1 inline h-3.5 w-3.5 -translate-y-px" />{" "}
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                onClick={trackPhoneClick}
                className="transition hover:text-primary"
              >
                {phone}
              </a>
              {" · "}
              <a
                href={`mailto:${email}`}
                onClick={trackEmailClick}
                className="transition hover:text-primary"
              >
                {email}
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-5 pb-20 lg:pb-5">
          <div className="mx-auto max-w-[1300px] px-6">
            <p className="text-[16px] text-muted-foreground">
              © {new Date().getFullYear()} {siteName}
              {settings?.legalName && settings.legalName !== siteName
                ? `, operated by ${settings.legalName}`
                : ""}
              {settings?.tourismRegNumber
                ? ` · J&K Tourism Reg. ${settings.tourismRegNumber}`
                : " · J&K Tourism Licensed"}
              {" · "}Razorpay Secured Payments
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
