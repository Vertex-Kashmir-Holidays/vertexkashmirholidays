import { ContactFAQs } from '@/components/contact/ContactFAQs';
import { ContactForm } from '@/components/contact/ContactForm';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactOfficeMap } from '@/components/contact/ContactOfficeMap';
import { ContactPromise } from '@/components/contact/ContactPromise';
import { ContactReachCards } from '@/components/contact/ContactReachCards';
import { ContactSocial } from '@/components/contact/ContactSocial';
import { ContactTestimonials } from '@/components/contact/ContactTestimonials';
import { ContactWhatsAppFloat } from '@/components/contact/ContactWhatsAppFloat';
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us — Plan Your Kashmir Trip | Vertex Kashmir Holidays",
  description:
    "Get in touch with our Srinagar-based Kashmir experts for personalised tour packages. WhatsApp, email or call us for customised honeymoon, family and adventure itineraries.",
  canonical: `${SITE_URL}/contact`,
});

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Vertex Kashmir Holidays",
  url: `${SITE_URL}/contact`,
  description: "Plan your Kashmir trip with local experts",
};

export default function ContactPage() {
  return (
    <div className="bg-white text-brand-ink">
      <JsonLd data={contactPageJsonLd} />
      <ContactHero />
      
      <main className="mx-auto max-w-[1300px] px-6 py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_300px]">
          <div className="min-w-0">
            <ContactReachCards />
            <ContactPromise />
          </div>
          <ContactForm />
        </div>

        <ContactOfficeMap />

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.15fr_1fr]">
          <ContactFAQs />
          <ContactTestimonials />
          <ContactSocial />
        </section>
      </main>

      <ContactWhatsAppFloat />
    </div>
  );
}