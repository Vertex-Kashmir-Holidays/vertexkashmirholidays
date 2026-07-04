import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vertexkashmirholidays.com";
export const SITE_NAME = "Vertex Kashmir Holidays";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/social/vertex-og-1200x630.png`;

interface BuildMetadataOptions {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogType?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  noindex?: boolean;
}

export function buildMetadata({
  title,
  description,
  canonical,
  ogImage,
  ogTitle,
  ogDescription,
  ogType = "website",
  publishedTime,
  authors,
  noindex,
}: BuildMetadataOptions): Metadata {
  const image = ogImage && ogImage.startsWith("http") ? ogImage : ogImage ? `${SITE_URL}${ogImage}` : DEFAULT_OG_IMAGE;
  const socialTitle = ogTitle ?? title;
  const socialDescription = ogDescription ?? description;

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      siteName: SITE_NAME,
      type: ogType,
      ...(canonical ? { url: canonical } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: socialTitle }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [image],
    },
  };
}
