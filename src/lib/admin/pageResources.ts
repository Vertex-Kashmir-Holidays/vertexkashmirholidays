// Server-only registry: maps a resource key → its Prisma delegate + zod schema.
// Used by the generic page-content API routes. Do NOT import in client code.
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FIELD_DEFS, buildItemSchema, getMeta, type ResourceMeta } from "@/lib/admin/pageFields";

// Minimal structural type covering the delegate methods the generic API uses.
interface Delegate {
  findMany: (args?: unknown) => Promise<unknown[]>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
}

// Which page module (RBAC permission key) owns each resource.
export type PageModule = "home" | "about" | "contact";

const RESOURCE_MODULE: Record<keyof typeof FIELD_DEFS, PageModule> = {
  heroSlides: "home",
  tickerItems: "home",
  siteStats: "home",
  whyChooseItems: "home",
  offers: "home",
  videoReviews: "home",
  homeSections: "home",
  aboutStoryFeatures: "about",
  aboutStats: "about",
  aboutValues: "about",
  teamMembers: "about",
  journeyMilestones: "about",
  pressLogos: "about",
  contactHeroFeatures: "contact",
  contactPromiseItems: "contact",
  contactFaqs: "contact",
  contactOffices: "contact",
};

interface ResourceDef {
  model: Delegate;
  schema: z.ZodTypeAny;
  meta: ResourceMeta;
  module: PageModule;
}

const DELEGATES: Record<keyof typeof FIELD_DEFS, Delegate> = {
  heroSlides: prisma.heroSlide as unknown as Delegate,
  tickerItems: prisma.tickerItem as unknown as Delegate,
  siteStats: prisma.siteStat as unknown as Delegate,
  whyChooseItems: prisma.whyChooseItem as unknown as Delegate,
  offers: prisma.offer as unknown as Delegate,
  videoReviews: prisma.videoReview as unknown as Delegate,
  homeSections: prisma.homeSection as unknown as Delegate,
  aboutStoryFeatures: prisma.aboutStoryFeature as unknown as Delegate,
  aboutStats: prisma.aboutStat as unknown as Delegate,
  aboutValues: prisma.aboutValue as unknown as Delegate,
  teamMembers: prisma.teamMember as unknown as Delegate,
  journeyMilestones: prisma.journeyMilestone as unknown as Delegate,
  pressLogos: prisma.pressLogo as unknown as Delegate,
  contactHeroFeatures: prisma.contactHeroFeature as unknown as Delegate,
  contactPromiseItems: prisma.contactPromiseItem as unknown as Delegate,
  contactFaqs: prisma.contactFaq as unknown as Delegate,
  contactOffices: prisma.contactOffice as unknown as Delegate,
};

export const RESOURCES: Record<string, ResourceDef> = Object.fromEntries(
  Object.keys(FIELD_DEFS).map((key) => {
    const meta = getMeta(key);
    return [key, { model: DELEGATES[key], schema: buildItemSchema(FIELD_DEFS[key], meta), meta, module: RESOURCE_MODULE[key] }];
  }),
);

export function getResource(key: string): ResourceDef | null {
  return RESOURCES[key] ?? null;
}

// ── Singleton page-content models (flat field bags, id: "singleton") ──
interface SingletonDelegate {
  upsert: (args: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown>;
}

export const CONTENT_DELEGATES: Record<string, SingletonDelegate> = {
  home: prisma.homeContent as unknown as SingletonDelegate,
  about: prisma.aboutContent as unknown as SingletonDelegate,
  contact: prisma.contactContent as unknown as SingletonDelegate,
};

export function getContentDelegate(key: string): SingletonDelegate | null {
  return CONTENT_DELEGATES[key] ?? null;
}
