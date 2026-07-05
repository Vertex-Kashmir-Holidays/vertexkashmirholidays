import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GTMScript } from "@/components/providers/GTMScript";
import "./globals.css";


const rawGtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "";
const GTM_ID = /^GTM-[A-Z0-9]+$/.test(rawGtmId) ? rawGtmId : null;


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


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  // Set by middleware for /admin/* — GTM must never load there. See
  // src/lib/internalRoutes.ts and src/proxy.ts.
  const analyticsDisabled = requestHeaders.get("x-analytics-disabled") === "1";

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
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {GTM_ID && !analyticsDisabled && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {GTM_ID && !analyticsDisabled && <GTMScript gtmId={GTM_ID} nonce={nonce} />}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
