// src/components/sections/ContactForm.tsx
'use client';

import { motion } from 'framer-motion';

export function ContactForm() {
  const formTrust = ['No spam. Ever.', 'We reply within 2 hours', '100% free advice'];

  return (
    <aside className="rounded-2xl border border-brand-line bg-white p-5 shadow-card lg:sticky lg:top-24">
      <motion.p
        className="text-[11px] font-bold tracking-[0.22em] text-brand-green2"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        SEND US A MESSAGE
      </motion.p>
      <motion.h2
        className="h-display mt-2 font-display text-[23px] font-bold leading-snug"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Let's Plan Your Kashmir Trip
      </motion.h2>

      <form className="mt-5 space-y-3.5" id="contactForm">
        <div>
          <label htmlFor="cName" className="text-[12px] font-semibold">
            Your Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="cName"
            name="name"
            required
            className="mt-1.5 w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-brand-mute/70 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label htmlFor="cEmail" className="text-[12px] font-semibold">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="cEmail"
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-brand-mute/70 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label htmlFor="cPhone" className="text-[12px] font-semibold">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            id="cPhone"
            name="phone"
            type="tel"
            required
            className="mt-1.5 w-full rounded-lg border border-brand-line px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-brand-mute/70 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
            placeholder="+91 00000 00000"
          />
        </div>
        {/* <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cMonth" className="text-[12px] font-semibold">
              When are you planning?
            </label>
            <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-brand-line transition focus-within:border-brand-green2 focus-within:ring-2 focus-within:ring-brand-green2/20">
              <input
                id="cMonth"
                name="month"
                className="w-full px-3 py-2.5 text-[12.5px] outline-none placeholder:text-brand-mute/70"
                placeholder="Select month"
                onFocus={(e) => (e.target.type = 'month')}
              />
              <svg viewBox="0 0 24 24" className="mr-2.5 h-4 w-4 shrink-0 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>
          <div>
            <label htmlFor="cPax" className="text-[12px] font-semibold">
              Travellers
            </label>
            <div className="relative mt-1.5">
              <select
                id="cPax"
                name="travellers"
                className="w-full appearance-none rounded-lg border border-brand-line bg-white px-3 py-2.5 text-[12.5px] outline-none transition focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
              >
                <option>1 Traveller</option>
                <option selected>2 Travellers</option>
                <option>3 Travellers</option>
                <option>4 Travellers</option>
                <option>5+ Travellers</option>
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div> */}
        {/* <div>
          <label htmlFor="cInterest" className="text-[12px] font-semibold">
            What interests you?
          </label>
          <div className="relative mt-1.5">
            <select
              id="cInterest"
              name="interest"
              className="w-full appearance-none rounded-lg border border-brand-line bg-white px-3.5 py-2.5 text-[12.5px] text-brand-mute outline-none transition focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
            >
              <option value="" selected>Select interests</option>
              <option>Honeymoon</option>
              <option>Family Vacation</option>
              <option>Adventure & Trekking</option>
              <option>Luxury Travel</option>
              <option>Skiing & Snow</option>
              <option>Photography</option>
            </select>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div> */}
        {/* <div>
          <label htmlFor="cMsg" className="text-[12px] font-semibold">
            Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="cMsg"
            name="message"
            rows={4}
            required
            className="mt-1.5 w-full resize-none rounded-lg border border-brand-line px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-brand-mute/70 focus:border-brand-green2 focus:ring-2 focus:ring-brand-green2/20"
            placeholder="Tell us about your dream trip..."
          />
        </div> */}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-semibold text-brand-ink/70">
          {formTrust.map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-bright" fill="currentColor">
                <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 3.8-3.8 1.4 1.4-5.2 5.2Z" />
              </svg>
              {t}
            </span>
          ))}
        </div>

        <motion.button
          type="submit"
          className="!mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-green py-3 text-[13.5px] font-bold text-white shadow-card transition hover:brightness-110"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Send Message
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </motion.button>
      </form>

      <p className="mt-3.5 flex items-center justify-center gap-2 text-[12px] text-brand-mute">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-wa" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
        </svg>
        Prefer WhatsApp? <a href="#" className="font-bold text-brand-green2 hover:underline">Chat instantly</a>
      </p>
    </aside>
  );
}