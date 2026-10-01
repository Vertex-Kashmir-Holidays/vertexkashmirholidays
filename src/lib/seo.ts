import type { Metadata } from "next";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/env.public";

export const SITE_URL = NEXT_PUBLIC_SITE_URL ?? "https://vertexkashmirholidays.com";
export const SITE_NAME = "Vertex Kashmir Holidays";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/social/vertex-og-1200x630.png`;

// Total <title> budget, including the " | Vertex Kashmir Holidays" suffix the
// root layout's title.template appends to every page.
const TITLE_SUFFIX = ` | ${SITE_NAME}`;
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

// Cuts at the last word boundary within the budget rather than mid-word.
function truncateForSeo(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const cut = str.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

// A stored title may already end with the brand ("… | Vertex Kashmir",
// "… | Vertex Kashmir Holidays"). Strip that, then always return title.absolute
// (so the layout template never appends a second brand): title + brand when it
// fits in MAX_TITLE_LENGTH, otherwise the title alone, cut on a word boundary
// only if it is itself longer than that.
const BRAND_PIPE_TAIL = /\s*\|\s*Vertex Kashmir(?:\s+Holidays)?\s*$/i;

function buildTitle(title: string): Metadata["title"] {
  const t = title.replace(/\s+/g, " ").trim().replace(BRAND_PIPE_TAIL, "");
  const withBrand = t + TITLE_SUFFIX;
  if (withBrand.length <= MAX_TITLE_LENGTH) return { absolute: withBrand };
  return { absolute: truncateForSeo(t, MAX_TITLE_LENGTH) };
}

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
  const image =
    ogImage && ogImage.startsWith("http")
      ? ogImage
      : ogImage
        ? `${SITE_URL}${ogImage}`
        : DEFAULT_OG_IMAGE;
  const socialTitle = ogTitle ?? title;
  const socialDescription = ogDescription ?? description;

  // <title>/<meta description> are length-capped for SEO; OG/Twitter previews
  // keep the full, untruncated copy since they have their own conventions.
  const finalTitle = buildTitle(title);
  const finalDescription = truncateForSeo(description, MAX_DESCRIPTION_LENGTH);

  return {
    title: finalTitle,
    description: finalDescription,
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
