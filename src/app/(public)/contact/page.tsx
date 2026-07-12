// src/app/(public)/contact/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { FaqPreviewList } from '@/components/faqs/FaqPreviewList';
import { ContactForm } from '@/components/contact/ContactForm';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactOfficeMap } from '@/components/contact/ContactOfficeMap';
import { ContactPromise } from '@/components/contact/ContactPromise';
import { ContactReachCards } from '@/components/contact/ContactReachCards';
import { ContactSocial } from '@/components/contact/ContactSocial';
import { ContactTestimonials } from '@/components/contact/ContactTestimonials';
import { ContactWhatsAppFloat } from '@/components/contact/ContactWhatsAppFloat';
import { getDisplayReviews } from '@/lib/reviews';
import { getGooglePlaceHoursAndLocation } from '@/lib/reviews/googlePlaces';
import { getFaqsForPlacement } from '@/lib/faqs';
import { formatBusinessAddress } from '@/lib/businessAddress';
import { JsonLd, buildBreadcrumbList, buildFAQPage, buildOrganizationLocation, buildContactPage } from '@/components/seo/JsonLd';
import type { ContactReachCardData, ContactSocialLink } from '@/types/contact';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, content] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.contactContent.findUnique({ where: { id: 'singleton' } }),
  ]);
  return buildMetadata({
    title:
      settings?.metaTitle ??
      'Contact Us — Plan Your Kashmir Trip | Vertex Kashmir Holidays',
    description:
      'Get in touch with our Srinagar-based Kashmir experts for personalised tour packages. WhatsApp, email or call us for customised honeymoon, family and adventure itineraries.',
    canonical: `${SITE_URL}/contact`,
    ogImage: content?.ogImage ?? content?.heroImage ?? null,
  });
}

const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, '')}`;
const telLink = (n: string) => `tel:${n.replace(/\s/g, '')}`;

export default async function ContactPage() {
  const [content, heroFeatures, promiseItems, faqs, offices, settings, testimonials] =
    await Promise.all([
      prisma.contactContent.findUnique({ where: { id: 'singleton' } }),
      prisma.contactHeroFeature.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.contactPromiseItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      // Centralized FAQ module — same Faq pool /about and /faq draw from.
      getFaqsForPlacement('CONTACT'),
      prisma.contactOffice.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
      // Approved customer reviews (admin-managed) replace CMS testimonials here.
      getDisplayReviews(8),
    ]);

  // Google Business Profile is the single source of truth for business hours
  // whenever it's reachable — the CMS field below only serves as a fallback
  // if the API/key is unavailable. This is the same object Task 7's
  // openingHoursSpecification schema reads from, so the visible text and the
  // schema can never disagree.
  const { hours: googleHours, location: googleLocation } = await getGooglePlaceHoursAndLocation(settings?.googlePlaceId);
  const officeHours = googleHours ? googleHours.weekdayText.join('\n') : (content?.officeHours ?? null);

  const phone = settings?.sitePhone ?? null;
  const email = settings?.siteEmail ?? null;
  const address = formatBusinessAddress(settings) ?? settings?.siteAddress ?? null;
  const whatsapp = settings?.whatsapp ?? phone ?? null;
  const directionsUrl =
    content?.directionsUrl ??
    settings?.googleBusinessProfile ??
    (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '#');

  // Reach cards built from real SiteSettings contact channels.
  const reachCards: ContactReachCardData[] = [
    whatsapp && {
      type: 'whatsapp' as const,
      title: 'WhatsApp',
      value: whatsapp,
      subtitle: 'Instant reply — chat with our team',
      cta: 'Chat on WhatsApp',
      href: waLink(whatsapp),
    },
    phone && {
      type: 'call' as const,
      title: 'Call Us',
      value: phone,
      subtitle: 'Mon – Sat, 9 AM – 9 PM IST',
      cta: 'Call Now',
      href: telLink(phone),
    },
    email && {
      type: 'email' as const,
      title: 'Email Us',
      value: email,
      subtitle: 'We reply within 2 hours',
      cta: 'Send Email',
      href: `mailto:${email}`,
    },
    address && {
      type: 'visit' as const,
      title: 'Visit Us',
      value: address,
      subtitle: 'Mon – Sat, 10 AM – 6 PM',
      cta: 'Get Directions',
      href: directionsUrl,
    },
  ].filter(Boolean) as ContactReachCardData[];

  // Social links from SiteSettings (only render those that exist).
  const socialLinks: ContactSocialLink[] = (
    [
      ['instagram', settings?.instagram],
      ['facebook', settings?.facebook],
      ['youtube', settings?.youtube],
      ['twitter', settings?.twitter],
      whatsapp ? ['whatsapp', waLink(whatsapp)] : null,
    ] as Array<[ContactSocialLink['type'], string | null | undefined] | null>
  )
    .filter((x): x is [ContactSocialLink['type'], string] => Boolean(x && x[1]))
    .map(([type, href]) => ({ type, href }));

  // Organization schema is injected sitewide in `(public)/layout.tsx` — not
  // duplicated here.
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Home', url: SITE_URL },
    { name: 'Contact', url: `${SITE_URL}/contact` },
  ]);
  // Short answers only — matches what's actually rendered below.
  const faqJsonLd = faqs.length > 0 ? buildFAQPage(faqs.map((f) => ({ question: f.question, answer: f.shortAnswer }))) : null;
  // Augments the sitewide Organization node with geo/hours — only meaningful
  // here, where the office location is actually shown on-page.
  const organizationLocationJsonLd = buildOrganizationLocation({
    geo: googleLocation,
    openingHours: googleHours?.periods,
  });
  const contactPageJsonLd = buildContactPage({ telephone: phone, email });

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <JsonLd data={organizationLocationJsonLd} />
      <JsonLd data={contactPageJsonLd} />
      <ContactHero
        data={{
          breadcrumb: content?.heroBreadcrumb ?? null,
          title: content?.heroTitle ?? null,
          subtitle: content?.heroSubtitle ?? null,
          image: content?.heroImage ?? null,
          imageMobile: content?.heroImageMobile ?? null,
        }}
        features={heroFeatures.map((f) => ({
          id: f.id,
          title: f.title,
          subtitle: f.subtitle,
          icon: f.icon,
        }))}
      />

      <main className="mx-auto max-w-[1300px] px-6 py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_300px]">
          <div className="min-w-0">
            <ContactReachCards
              heading={{ kicker: content?.reachKicker ?? null, title: content?.reachTitle ?? null }}
              cards={reachCards}
            />
            <ContactPromise
              heading={{ kicker: content?.promiseKicker ?? null, title: content?.promiseTitle ?? null }}
              items={promiseItems.map((p) => ({
                id: p.id,
                title: p.title,
                subtitle: p.subtitle,
                icon: p.icon,
              }))}
            />
          </div>
          <ContactForm
            content={{
              kicker: content?.formKicker ?? null,
              title: content?.formTitle ?? null,
              note: content?.formNote ?? null,
              whatsappHref: whatsapp ? waLink(whatsapp) : '#',
            }}
          />
        </div>

        <ContactOfficeMap
          content={{
            kicker: content?.officeKicker ?? null,
            title: content?.officeTitle ?? null,
            subtitle: content?.officeSubtitle ?? null,
            name: content?.officeName ?? null,
            address: content?.officeAddress ?? address,
            hours: officeHours,
            mapLabel: content?.officeMapLabel ?? null,
            mapSubLabel: content?.officeMapSubLabel ?? null,
            directionsUrl,
            phone,
            email,
            legalName: settings?.legalName ?? null,
            tourismRegNumber: settings?.tourismRegNumber ?? null,
            brandName: settings?.siteName ?? null,
            placeId: settings?.googlePlaceId ?? null,
          }}
          offices={offices.map((o) => ({
            id: o.id,
            name: o.name,
            address: o.address,
            hours: o.hours,
          }))}
        />

        {faqs.length > 0 && (
          <section className="mt-16 border-t border-border pt-14">
            <div className="text-center">
              <p className="text-[12px] font-bold tracking-[0.22em] text-primary">{content?.faqsKicker ?? 'QUESTIONS'}</p>
              <h2 className="h-display mt-2 font-display text-[18px] font-bold">{content?.faqsTitle ?? 'Frequently Asked'}</h2>
            </div>
            <div className="mt-8">
              <FaqPreviewList faqs={faqs} columns={2} />
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href={content?.faqsCtaHref && content.faqsCtaHref !== '#' ? content.faqsCtaHref : '/faq'}
                className="inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
              >
                {content?.faqsCtaLabel ?? 'View all FAQs'}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </div>
          </section>
        )}

        <section className="mt-16 border-t border-border pt-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <ContactTestimonials
              heading={{
                kicker: content?.testimonialsKicker ?? null,
                title: content?.testimonialsTitle ?? null,
              }}
              testimonials={testimonials.map((t) => ({
                id: t.id,
                name: t.name,
                location: t.location,
                avatar: t.avatar,
                quote: t.quote,
                rating: t.rating,
              }))}
            />
            <ContactSocial
              content={{
                kicker: content?.socialKicker ?? null,
                title: content?.socialTitle ?? null,
                text: content?.socialText ?? null,
                ctaLabel: content?.socialCtaLabel ?? null,
                ctaHref: content?.socialCtaHref ?? null,
              }}
              socials={socialLinks}
            />
          </div>
        </section>
      </main>

      <ContactWhatsAppFloat
        text={content?.whatsappFloatText ?? 'Chat with us'}
        href={whatsapp ? waLink(whatsapp) : '#'}
      />
    </div>
  );
}
