// src/app/(public)/contact/page.tsx

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { JsonLd, buildTravelAgency } from '@/components/seo/JsonLd';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { ContactFAQs } from '@/components/contact/ContactFAQs';
import { ContactForm } from '@/components/contact/ContactForm';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactOfficeMap } from '@/components/contact/ContactOfficeMap';
import { ContactPromise } from '@/components/contact/ContactPromise';
import { ContactReachCards } from '@/components/contact/ContactReachCards';
import { ContactSocial } from '@/components/contact/ContactSocial';
import { ContactTestimonials } from '@/components/contact/ContactTestimonials';
import { ContactWhatsAppFloat } from '@/components/contact/ContactWhatsAppFloat';
import { getDisplayReviews } from '@/lib/reviews';
import type { ContactReachCardData, ContactSocialLink } from '@/types/contact';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
  return buildMetadata({
    title:
      settings?.metaTitle ??
      'Contact Us — Plan Your Kashmir Trip | Vertex Kashmir Holidays',
    description:
      'Get in touch with our Srinagar-based Kashmir experts for personalised tour packages. WhatsApp, email or call us for customised honeymoon, family and adventure itineraries.',
    canonical: `${SITE_URL}/contact`,
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
      prisma.contactFaq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.contactOffice.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
      // Approved customer reviews (admin-managed) replace CMS testimonials here.
      getDisplayReviews(8),
    ]);

  const phone = settings?.sitePhone ?? null;
  const email = settings?.siteEmail ?? null;
  const address = settings?.siteAddress ?? null;
  const whatsapp = settings?.whatsapp ?? phone ?? null;
  const directionsUrl =
    content?.directionsUrl ??
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

  const organizationLd = buildTravelAgency({
    telephone: phone,
    email,
    streetAddress: address,
    sameAs: [
      settings?.instagram,
      settings?.facebook,
      settings?.youtube,
      settings?.twitter,
    ].filter((s): s is string => Boolean(s)),
  });

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={organizationLd} />
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
            hours: content?.officeHours ?? null,
            mapLabel: content?.officeMapLabel ?? null,
            mapSubLabel: content?.officeMapSubLabel ?? null,
            directionsUrl,
            phone,
            email,
          }}
          offices={offices.map((o) => ({
            id: o.id,
            name: o.name,
            address: o.address,
            hours: o.hours,
          }))}
        />

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.15fr_1fr]">
          <ContactFAQs
            heading={{ kicker: content?.faqsKicker ?? null, title: content?.faqsTitle ?? null }}
            faqs={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
            ctaLabel={content?.faqsCtaLabel ?? null}
            ctaHref={content?.faqsCtaHref ?? null}
          />
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
        </section>
      </main>

      <ContactWhatsAppFloat
        text={content?.whatsappFloatText ?? 'Chat with us'}
        href={whatsapp ? waLink(whatsapp) : '#'}
      />
    </div>
  );
}
