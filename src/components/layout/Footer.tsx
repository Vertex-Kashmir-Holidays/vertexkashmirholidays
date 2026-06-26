'use client';


import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { InstagramIcon, FacebookIcon, YoutubeIcon, WhatsAppIcon } from '@/components/icons/brand';
import { trackWhatsappClick, trackPhoneClick, trackEmailClick } from '@/lib/analytics';


export interface FooterSettings {
 siteName: string;
 siteTagline: string | null;
 siteEmail: string | null;
 sitePhone: string | null;
 siteAddress: string | null;
 whatsapp: string | null;
 facebook: string | null;
 instagram: string | null;
 twitter: string | null;
 youtube: string | null;
}


export function Footer({ settings }: { settings?: FooterSettings | null }) {
 const siteName = settings?.siteName ?? 'Vertex Kashmir Holidays';
 const tagline =
   settings?.siteTagline ??
   'Locally based in Srinagar. Handcrafted Kashmir holidays with zero middlemen, transparent pricing and 24/7 on-ground support.';
 const phone = settings?.sitePhone ?? '+91 99999 00000';
 const email = settings?.siteEmail ?? 'hello@vertexkashmir.com';
 const address = settings?.siteAddress ?? 'Boulevard Road, Dal Gate, Srinagar 190001';


 // Build a WhatsApp click-to-chat link from the settings number (whatsapp →
 // phone fallback), with a context-appropriate prefilled message.
 const waDigits = (settings?.whatsapp || settings?.sitePhone || '').replace(/[^0-9]/g, '');
 const wa = (message: string) =>
   waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}` : '/contact';


 const planTripHref = wa(
   `Hi ${siteName}! I'd like to plan my Kashmir trip. Please share a handcrafted itinerary.`,
 );
 const whatsappChatHref = wa(`Hi ${siteName}! I have a question about your Kashmir tours.`);


 return (
   <footer className="relative z-[2] mt-16">
     <div className="mx-auto max-w-[1300px] px-6">
       <div className="sweep glass-strong relative overflow-hidden rounded-[2rem] p-10 text-center shadow-glass">
         <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl"></div>
         <div aria-hidden className="orb orb-gold absolute -right-16 -bottom-16 h-64 w-64"></div>
         <h2 className="rv h-display text-4xl font-bold text-foreground">
           Ready to step <span className="grad-text-cool italic">through the portal?</span>
         </h2>
         <p className="rv mt-3 text-sm text-muted-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
           Tell us your dates — get a handcrafted itinerary on WhatsApp within the hour.
         </p>
         <div className="rv mt-7 flex flex-wrap justify-center gap-3" style={{ '--rd': '0.16s' } as React.CSSProperties}>
           <a
             href={planTripHref}
             target="_blank"
             rel="noopener noreferrer"
             onClick={() => trackWhatsappClick('footer_cta')}
             className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:scale-[1.03]"
           >
             Plan My Trip Free →
           </a>
           <Link
             href="/tours"
             className="glass rounded-full px-8 py-3.5 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
           >
             Browse Packages
           </Link>
         </div>
       </div>
     </div>


     <div className="mt-16 border-t border-border bg-card/60 backdrop-blur">
       <div className="mx-auto grid max-w-[1300px] gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
         <div>
           <Logo variant="auto" href="/" className="h-9" />
           <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">{tagline}</p>
           <div className="mt-5 flex gap-2.5">
             {settings?.instagram && (
               <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                 <InstagramIcon className="h-[18px] w-[18px]" />
               </a>
             )}
             {settings?.facebook && (
               <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                 <FacebookIcon className="h-[18px] w-[18px]" />
               </a>
             )}
             {settings?.youtube && (
               <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
                 <YoutubeIcon className="h-[18px] w-[18px]" />
               </a>
             )}
             <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={() => trackWhatsappClick('footer_social')} className="glass grid h-9 w-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/10">
               <WhatsAppIcon className="h-[18px] w-[18px]" />
             </a>
           </div>
         </div>
         <div>
           <p className="text-sm font-bold text-foreground">Explore</p>
           <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
             <li>
               <Link href="/tours" className="transition hover:text-primary">Tour Packages</Link>
             </li>
             <li>
               <Link href="/destinations" className="transition hover:text-primary">Destinations</Link>
             </li>
             <li>
               <Link href="/offers" className="transition hover:text-primary">Special Offers</Link>
             </li>
             <li>
               <Link href="/blog" className="transition hover:text-primary">Travel Blog</Link>
             </li>
             <li>
               <Link href="/about" className="transition hover:text-primary">About Us</Link>
             </li>
           </ul>
         </div>
         <div>
           <p className="text-sm font-bold text-foreground">Support</p>
           <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
             <li>
               <Link href="/contact" className="transition hover:text-primary">Contact Us</Link>
             </li>
             <li>
               <Link href="/contact#faqs" className="transition hover:text-primary">FAQs</Link>
             </li>
             <li>
               <Link href="/refund-and-cancellation" className="transition hover:text-primary">Refund &amp; Cancellation</Link>
             </li>
             <li>
               <Link href="/terms-and-conditions" className="transition hover:text-primary">Terms &amp; Conditions</Link>
             </li>
             <li>
               <Link href="/privacy-policy" className="transition hover:text-primary">Privacy Policy</Link>
             </li>
           </ul>
         </div>
         <div>
           <p className="text-sm font-bold text-foreground">Get valley updates</p>
           <p className="mt-3 text-[13px] text-muted-foreground">Snow alerts, new treks &amp; flash deals. One email a month.</p>
           <div className="mt-4 flex overflow-hidden rounded-full border border-border bg-foreground/[.04] p-1">
             <input
               type="email"
               aria-label="Email address for newsletter"
               autoComplete="email"
               className="w-full bg-transparent px-4 text-sm text-foreground placeholder-foreground/40 outline-none"
               placeholder="Email address"
             />
             <button className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground ring-inner">
               Subscribe
             </button>
           </div>
           <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
             <MapPin className="mr-1 inline h-3.5 w-3.5 -translate-y-px" /> {address}
             <br />
             <Phone className="mr-1 inline h-3.5 w-3.5 -translate-y-px" /> <a href={`tel:${phone.replace(/\s+/g, '')}`} onClick={trackPhoneClick} className="transition hover:text-primary">{phone}</a>
             {' · '}
             <a href={`mailto:${email}`} onClick={trackEmailClick} className="transition hover:text-primary">{email}</a>
           </p>
         </div>
       </div>
       <div className="border-t border-border py-5">
         <p className="mx-auto max-w-[1300px] px-6 text-center text-[12px] text-muted-foreground">
           © {new Date().getFullYear()} {siteName} · J&amp;K Tourism Licensed · Razorpay Secured Payments
         </p>
       </div>
     </div>
   </footer>
 );
}
