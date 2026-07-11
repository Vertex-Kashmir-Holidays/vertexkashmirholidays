import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { AttributionCapture } from "@/components/providers/AttributionCapture";
import { SITE_NAME } from "@/lib/seo";
import "./globals.css";


const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});


const sansFont = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});


const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertexkashmirholidays.com";


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Vertex Kashmir Holidays",
  title: {
    template: "%s | Vertex Kashmir Holidays",
    default: "Vertex Kashmir Holidays — Premium Kashmir Tourism & Booking",
  },
  description:
    "Discover Kashmir with Vertex — curated honeymoon, family, adventure and luxury packages. Dal Lake houseboats, Gondola rides, glacier treks. Book online.",
  keywords: [
    "Kashmir tour packages",
    "Kashmir honeymoon",
    "Gulmarg",
    "Pahalgam",
    "Dal Lake houseboat",
    "Kashmir adventure trek",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Vertex Kashmir Holidays",
    title: "Vertex Kashmir Holidays — Premium Kashmir Tourism & Booking",
    description:
      "Curated Kashmir packages — honeymoon, family, adventure, luxury. Houseboat stays, Gondola, glacier treks.",
    images: [
      {
        url: "/brand/social/vertex-og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Vertex Kashmir Holidays",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vertex Kashmir Holidays",
    description:
      "Premium Kashmir tourism — honeymoon, family, adventure, luxury packages.",
    images: ["/brand/social/vertex-og-1200x630.png"],
  },
  ...(process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION
    ? { other: { "facebook-domain-verification": process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION } }
    : {}),
};


export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F1DD" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1F3A" },
  ],
};


// No headers()/cookies() call anywhere in this file — that's deliberate. Every
// route in the app renders this layout, so any dynamic API call here would
// force full dynamic rendering everywhere, defeating ISR on public pages (see
// the perf audit). ThemeProvider, GTMScript and Toaster — all of which used to
// live here and need a per-request CSP nonce — now live in each route group's
// own layout instead: src/app/(public)/layout.tsx (no nonce, static CSP),
// src/app/admin/layout.tsx, src/app/account/layout.tsx and
// src/app/login/layout.tsx (all already dynamic via auth(), so reading the
// nonce there costs nothing extra).
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${sansFont.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://cdn.razorpay.com" />
        <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} Blog`} href="/rss.xml" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AttributionCapture />
        {children}
      </body>
    </html>
  );
}
