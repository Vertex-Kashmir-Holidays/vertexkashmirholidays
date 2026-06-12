import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
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
        url: "/brand/icon.png",
        width: 512,
        height: 512,
        alt: "Vertex Kashmir Holidays",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vertex Kashmir Holidays",
    description:
      "Premium Kashmir tourism — honeymoon, family, adventure, luxury packages.",
    images: ["/brand/icon.png"],
  },
  icons: {
    icon: "/brand/icon.png",
    apple: [{ url: "/brand/icon.png", sizes: "180x180", type: "image/jpeg" }],
    shortcut: "/brand/icon.png",
  },
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
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
