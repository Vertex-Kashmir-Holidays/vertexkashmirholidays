import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Script from "next/script";
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
      {/* Preconnect to analytics/tag-manager origins so the connection is
          established before afterInteractive scripts request them. */}
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://cdn.razorpay.com" />
    </head>
    <body className="font-sans antialiased">
      {/* GTM noscript fallback — must be the first child of <body>.
          dangerouslySetInnerHTML prevents React from trying to hydrate the
          <iframe> child; browsers with JS parse <noscript> as raw text so
          React's virtual DOM and the real DOM would otherwise diverge. */}
      {GTM_ID && (
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
      )}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
      {/* GTM container — Next.js injects <script async src="..."> natively.
          Do NOT use the GTM bootstrap snippet here; it relies on insertBefore
          DOM manipulation that is unreliable in App Router's post-hydration
          context. Letting Next.js own the <script> element is the correct
          approach and guaranteed to trigger a network request. */}
      {GTM_ID && (
        <Script
          id="gtm"
          src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
          strategy="afterInteractive"
        />
      )}
    </body>
  </html>
);
}
