// src/app/(public)/tours/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
 JsonLd,
 buildProduct,
 buildTouristTrip,
 buildBreadcrumbList,
 buildFAQPage,
 buildCampaignEvents,
} from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { TourDetailsFAQs } from "@/components/tours/TourDetailsFAQs";
import { TourDetailsGallery } from "@/components/tours/TourDetailsGallery";
import { TourDetailsHero } from "@/components/tours/TourDetailsHero";
import { TourDetailsInclusions } from "@/components/tours/TourDetailsInclusions";
import { TourDetailsItinerary } from "@/components/tours/TourDetailsItinerary";
import { TourDetailsOverview } from "@/components/tours/TourDetailsOverview";
import { TourDetailsReviews } from "@/components/tours/TourDetailsReviews";
import { TourDetailsSidebar } from "@/components/tours/TourDetailsSidebar";
import { TourDetailsTabs } from "@/components/tours/TourDetailsTabs";
import { ActivitiesShowcase } from "@/components/activities/ActivitiesShowcase";
import { AffordabilityWidget } from "@/components/payments/AffordabilityWidget";
import { BookingMobileBar } from "@/components/tours/BookingMobileBar";
import { PackageViewTracker } from "@/components/analytics/PackageViewTracker";
import { ScrollToTopOnMount } from "@/components/layout/ScrollToTopOnMount";


export const revalidate = 300;


type PageProps = { params: Promise<{ slug: string }> };


const CATEGORY_LABEL: Record<string, string> = {
 HONEYMOON: "Honeymoon",
 FAMILY: "Family",
 ADVENTURE: "Adventure",
 LUXURY: "Luxury",
};


function parseJson<T>(raw: string | null | undefined, fallback: T): T {
 if (!raw) return fallback;
 try {
   return JSON.parse(raw) as T;
 } catch {
   return fallback;
 }
}


async function getTour(slug: string) {
 return prisma.tour.findFirst({
   where: { slug, published: true },
   include: {
     destinations: { include: { destination: { select: { name: true } } } },
     reviews: {
       where: { approved: true },
       orderBy: { createdAt: "desc" },
       take: 12,
       include: { user: { select: { image: true } } },
     },
     // Published activities linked to this tour → "Things to Do".
     activities: {
       where: { activity: { published: true } },
       include: { activity: { select: { id: true, slug: true, name: true, description: true, coverImage: true, duration: true } } },
     },
   },
 });
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
 const { slug } = await params;
 const tour = await prisma.tour.findFirst({
   where: { slug, published: true },
   select: {
     title: true,
     excerpt: true,
     description: true,
     coverImage: true,
     metaTitle: true,
     metaDesc: true,
     ogImage: true,
   },
 });


 if (!tour) {
   return buildMetadata({
     title: "Tour Not Found",
     description: "The Kashmir tour package you are looking for could not be found.",
     canonical: `${SITE_URL}/tours/${slug}`,
     noindex: true,
   });
 }


 return buildMetadata({
   title: tour.metaTitle ?? tour.title,
   description:
     tour.metaDesc ??
     tour.excerpt ??
     tour.description ??
     `${tour.title} — a curated Kashmir tour package by Vertex Kashmir Holidays.`,
   canonical: `${SITE_URL}/tours/${slug}`,
   ogImage: tour.ogImage ?? tour.coverImage ?? null,
 });
}


export default async function TourDetailsPage({ params }: PageProps) {
 const { slug } = await params;
 const [tour, settings] = await Promise.all([
   getTour(slug),
   prisma.siteSettings.findUnique({
     where: { id: "singleton" },
     select: { sitePhone: true },
   }),
 ]);


 if (!tour) notFound();


 // ── Parse JSON fields ──────────────────────────────────────────────────────
 type GalleryItem = { url: string; alt: string };
 const gallery: GalleryItem[] = parseJson<unknown[]>(tour.gallery, []).map((item) =>
   typeof item === "string" ? { url: item, alt: "" } : (item as GalleryItem)
 );
 const inclusions = parseJson<string[]>(tour.inclusions, []);
 const exclusions = parseJson<string[]>(tour.exclusions, []);
 const highlights = parseJson<string[]>(tour.highlights, []);
 const faqs = parseJson<{ question: string; answer: string }[]>(tour.faqs, []);
 const batches = parseJson<{ date: string; seats: number; price: string; status: string }[]>(tour.batches, []);
 const rawItinerary = parseJson<
   { day: number; title: string; description?: string; image?: string }[]
 >(tour.itinerary, []);


 const itinerary = rawItinerary.map((d) => ({
   day: d.day,
   title: d.title,
   body: d.description ?? "",
   image: d.image,
 }));


 // ── Derived display values ─────────────────────────────────────────────────
 const categoryLabel = CATEGORY_LABEL[tour.category] ?? "Tour";
 const nights = Math.max(tour.duration - 1, 0);
 const durationLabel = `${nights}N / ${tour.duration}D`;
 const heroImages = [tour.coverImage, ...gallery.map((g) => g.url)].filter(
   (img): img is string => Boolean(img),
 );


 const happyLabel =
   tour.happyCount && tour.happyCount > 0
     ? `${tour.happyCount.toLocaleString()}+ Happy ${
         tour.category === "HONEYMOON" ? "Couples" : "Travellers"
       }`
     : "";


 const reviews = tour.reviews.map((r) => ({
   seed: r.id,
   name: r.name,
   // Per-review picture wins, then the reviewer's profile picture; null falls
   // back to a deterministic placeholder in the component.
   avatar: r.avatar ?? r.user?.image ?? null,
   meta: `${r.createdAt.toLocaleDateString("en-US", {
     month: "short",
     year: "numeric",
   })} · Verified Booking`,
   quote: r.body,
 }));


 // Things to Do — driven by the Activities module (published, linked to this tour).
 const things = tour.activities.map((a) => ({
   id: a.activity.id,
   image: a.activity.coverImage,
   title: a.activity.name,
   description: a.activity.description ?? "",
   duration: a.activity.duration,
   href: `/activities/${a.activity.slug}`,
 }));


 // ── Tabs (only for sections that have content) ─────────────────────────────
 const tabs = [
   { id: "overview", label: "Overview" },
   ...(itinerary.length ? [{ id: "itinerary", label: "Itinerary" }] : []),
   ...(inclusions.length || exclusions.length
     ? [{ id: "inclusions", label: "Inclusions" }]
     : []),
   ...(things.length ? [{ id: "things", label: "Things to Do" }] : []),
   ...(gallery.length ? [{ id: "gallery", label: "Gallery" }] : []),
   ...(reviews.length ? [{ id: "reviews", label: "Reviews" }] : []),
   ...(faqs.length ? [{ id: "faqs", label: "FAQs" }] : []),
 ];


 // ── Structured data (JSON-LD) ──────────────────────────────────────────────
 const TOURIST_TYPE: Record<string, string[]> = {
   HONEYMOON: ["Couples", "Honeymoon"],
   FAMILY: ["Family", "Families with children"],
   ADVENTURE: ["Adventure travelers", "Backpackers"],
   LUXURY: ["Luxury travelers"],
 };

 const breadcrumbJsonLd = buildBreadcrumbList([
   { name: "Home", url: SITE_URL },
   { name: "Tour Packages", url: `${SITE_URL}/tours` },
   { name: tour.title, url: `${SITE_URL}/tours/${tour.slug}` },
 ]);


 const productJsonLd = buildProduct({
   title: tour.title,
   slug: tour.slug,
   description: tour.excerpt ?? tour.description,
   coverImage: tour.coverImage,
   priceFrom: tour.priceFrom,
   rating: tour.rating,
   reviewCount: tour.reviewCount,
   reviews: tour.reviews.map((r) => ({
     name: r.name,
     rating: r.rating,
     body: r.body,
     createdAt: r.createdAt,
   })),
 });

 const eventLds = batches.length > 0
   ? buildCampaignEvents({ name: tour.title, slug: tour.slug, heroImage: tour.coverImage, batches })
   : [];

 const touristTripJsonLd = buildTouristTrip({
   title: tour.title,
   slug: tour.slug,
   description: tour.excerpt ?? tour.description,
   coverImage: tour.coverImage,
   duration: tour.duration,
   priceFrom: tour.priceFrom,
   touristType: TOURIST_TYPE[tour.category] ?? "General",
   itineraryItems: rawItinerary.map((d) => ({ position: d.day, name: d.title })),
 });


 return (
   <div className="bg-background text-foreground">
     <ScrollToTopOnMount />
     <PackageViewTracker packageName={tour.title} />
     <JsonLd data={breadcrumbJsonLd} />
     <JsonLd data={productJsonLd} />
     <JsonLd data={touristTripJsonLd} />
     {eventLds.map((ev, i) => <JsonLd key={i} data={ev} />)}
     {faqs.length > 0 && <JsonLd data={buildFAQPage(faqs)} />}


     <TourDetailsHero
       tourName={tour.title}
       duration={durationLabel}
       nights={nights}
       days={tour.duration}
       category={categoryLabel}
       transport={tour.transport ?? "Private Cab"}
       startCity={tour.startCity ?? "Srinagar"}
       difficulty={tour.difficulty ?? "Easy"}
       tagline={tour.tagline ?? tour.excerpt ?? ""}
       badge={tour.badge ?? categoryLabel}
       rating={tour.rating}
       reviews={tour.reviewCount}
       happyLabel={happyLabel}
       images={heroImages}
     />


     <main className="mx-auto max-w-[1300px] px-6 pt-6 pb-28 lg:pb-6">
       <TourDetailsTabs sections={tabs} />


       <div className="grid items-start gap-7 lg:grid-cols-[1fr_320px] mt-6">
         <div className="min-w-0">
           <section id="overview">
             <TourDetailsOverview
               description={tour.description ?? tour.excerpt ?? ""}
               chips={highlights}
             />
           </section>


           {itinerary.length > 0 && (
             <section id="itinerary" className="scroll-mt-16">
               <TourDetailsItinerary itinerary={itinerary} />
             </section>
           )}


           {(inclusions.length > 0 || exclusions.length > 0) && (
             <section id="inclusions" className="scroll-mt-16">
               <TourDetailsInclusions
                 inclusions={inclusions}
                 exclusions={exclusions}
               />
             </section>
           )}


           {things.length > 0 && (
             <section id="things" className="scroll-mt-16 mt-6">
               <ActivitiesShowcase title={`Things to Do on This Tour`} items={things} seeAllHref="/activities" />
             </section>
           )}


           {gallery.length > 0 && (
             <section id="gallery" className="scroll-mt-16">
               <TourDetailsGallery images={gallery} />
             </section>
           )}


           {reviews.length > 0 && (
             <section id="reviews" className="scroll-mt-16">
               <TourDetailsReviews
                 reviews={reviews}
                 totalReviews={tour.reviewCount}
               />
             </section>
           )}


           {faqs.length > 0 && (
             <section id="faqs" className="scroll-mt-16">
               <TourDetailsFAQs faqs={faqs} />
             </section>
           )}
         </div>


         <div className="space-y-5">
         <AffordabilityWidget amount={tour.priceFrom} />
         <TourDetailsSidebar
           price={tour.priceFrom}
           oldPrice={tour.priceWas ?? undefined}
           discountPct={tour.discountPct ?? undefined}
           rating={tour.rating}
           reviews={tour.reviewCount}
           tourId={tour.id}
           tourName={tour.title}
           tourSlug={tour.slug}
           formMode={tour.formMode}
           bestTime={tour.bestTime ?? "Apr – Oct"}
           tourType={tour.tourType ?? "Private Tour"}
           pickupDrop={tour.pickupDrop ?? `${tour.startCity ?? "Srinagar"} Airport`}
           helpPhone={settings?.sitePhone ?? "+91 94190 00000"}
         />
         </div>
       </div>
     </main>


     {/* Mobile-only sticky Book / Inquiry CTAs (forms open in a bottom-sheet). */}
     <BookingMobileBar
       formMode={tour.formMode}
       tourId={tour.id}
       tourName={tour.title}
       tourSlug={tour.slug}
       price={tour.priceFrom}
       oldPrice={tour.priceWas ?? undefined}
       discountPct={tour.discountPct ?? undefined}
     />
   </div>
 );
}
