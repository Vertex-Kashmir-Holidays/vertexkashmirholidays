import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";


const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;


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
        url: "/brand/kit/social/vertex-og-1200x630.png",
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
    images: ["/brand/kit/social/vertex-og-1200x630.png"],
  },
  // favicon.ico, icon.svg and apple-icon.png are auto-discovered from src/app.
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
        {/* Preconnect so the GTM/GA4 TCP handshake is already done before
            afterInteractive fires. DNS-prefetch is the no-CORS fallback. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://cdn.razorpay.com" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>

        {/* GoogleTagManager injects two scripts with strategy="afterInteractive":
            1. An inline bootstrap that initialises window.dataLayer and pushes
               { gtm.start, event: "gtm.js" } — the signal GTM needs to start
               firing tags (including the GA4 config tag for page_view).
            2. The gtm.js container script itself.
            It also renders the <noscript> iframe fallback for non-JS browsers.
            This is the only correct Next.js App Router approach — it avoids the
            DOM insertBefore race that breaks the raw snippet at hydration time. */}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      </body>
    </html>
  );
}
