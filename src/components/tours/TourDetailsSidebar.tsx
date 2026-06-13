// src/components/sections/TourDetailsSidebar.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface TourDetailsSidebarProps {
  price: number;
  oldPrice?: number;
  discountPct?: number;
  rating: number;
  reviews: number;
  tourId: string;
  tourName: string;
  bestTime: string;
  tourType: string;
  pickupDrop: string;
  helpPhone: string;
}

export function TourDetailsSidebar({
  price,
  oldPrice,
  discountPct,
  rating,
  reviews,
  tourId,
  tourName,
  bestTime,
  tourType,
  pickupDrop,
  helpPhone,
}: TourDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'book'>('inquiry');

  const trustItems = [
    { t: 'Lowest Price Guarantee', icon: 'M20.6 13.4 12 22l-8.6-8.6A5 5 0 0 1 12 6.5a5 5 0 0 1 8.6 6.9Z' },
    { t: 'Secure Payments', s: 'Powered by Razorpay', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' },
    { t: 'Free Cancellation', s: 'T&C Apply', icon: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 7v5l3 3' },
  ];

  const infoCards = [
    { t: 'Best Time to Visit', s: bestTime, icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
    { t: 'Tour Type', s: tourType, icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9' },
    { t: 'Pickup/Drop', s: pickupDrop, icon: 'M5 17h14l1-5-2-5H6L4 12Z' },
  ];

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {/* Price + Forms Card */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {discountPct ? (
          <span className="rounded-md bg-badge-red px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">
            {discountPct}% OFF
          </span>
        ) : null}
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-[30px] font-extrabold leading-none">₹{price.toLocaleString()}</span>
          <span className="text-[12px] font-medium text-muted-foreground">per person</span>
        </p>
        {oldPrice && (
          <p className="mt-1.5 text-[15px] font-semibold text-muted-foreground line-through">
            ₹{oldPrice.toLocaleString()}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3">
          <p className="flex items-center gap-1.5 text-[19px] font-extrabold">
            {rating}
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="currentColor">
              <path d="m12 2 3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1Z" />
            </svg>
          </p>
          <div className="leading-tight">
            <p className="text-[13px] font-bold">Excellent</p>
            <p className="text-[11.5px] text-muted-foreground">{reviews.toLocaleString()} reviews</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-3 text-foreground">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <p className="text-[12px] font-semibold leading-snug">
            Book with 20% advance to lock your dates
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex border-b border-border text-[14px] font-bold">
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`relative flex-1 pb-3 transition ${
              activeTab === 'inquiry' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Inquiry
            {activeTab === 'inquiry' && (
              <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`relative flex-1 pb-3 transition ${
              activeTab === 'book' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Book
            {activeTab === 'book' && (
              <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Inquiry Form */}
        <motion.form
          className="mt-4 space-y-3.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeTab === 'inquiry' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: activeTab === 'inquiry' ? 'block' : 'none' }}
        >
          <input type="hidden" name="tour_id" value={tourId} />
          <input type="hidden" name="tour_name" value={tourName} />

          <div>
            <label htmlFor="inqName" className="text-[12.5px] font-semibold">
              Name <span className="text-badge-red">*</span>
            </label>
            <input
              id="inqName"
              name="name"
              required
              className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label htmlFor="inqPhone" className="text-[12.5px] font-semibold">
              Phone <span className="text-badge-red">*</span>
            </label>
            <div className="mt-1.5 flex overflow-hidden rounded-lg border border-border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="flex items-center gap-1 border-r border-border bg-muted px-3 text-[13px] font-semibold text-muted-foreground">
                +91
              </span>
              <input
                id="inqPhone"
                name="phone"
                type="tel"
                required
                className="w-full px-3.5 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/70"
                placeholder="Enter your phone"
              />
            </div>
          </div>
          <div>
            <label htmlFor="inqEmail" className="text-[12.5px] font-semibold">
              Email <span className="font-medium text-muted-foreground">(optional)</span>
            </label>
            <input
              id="inqEmail"
              name="email"
              type="email"
              className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your email"
            />
          </div>
          <motion.button
            type="submit"
            className="!mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[14px] font-bold text-primary-foreground shadow-card transition hover:brightness-110"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Send Inquiry
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </motion.button>
          <p className="text-center text-[11px] text-muted-foreground">
            Our local expert replies on WhatsApp within 30 minutes.
          </p>
        </motion.form>

        {/* Book Form */}
        <motion.form
          className="mt-4 space-y-3.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeTab === 'book' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: activeTab === 'book' ? 'block' : 'none' }}
        >
          <input type="hidden" name="tour_id" value={tourId} />
          <input type="hidden" name="tour_name" value={tourName} />

          <div>
            <label htmlFor="bkName" className="text-[12.5px] font-semibold">
              Full Name <span className="text-badge-red">*</span>
            </label>
            <input
              id="bkName"
              name="name"
              required
              className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label htmlFor="bkEmail" className="text-[12.5px] font-semibold">
              Email <span className="text-badge-red">*</span>
            </label>
            <input
              id="bkEmail"
              name="email"
              type="email"
              required
              className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="bkPhone" className="text-[12.5px] font-semibold">
              Phone Number <span className="text-badge-red">*</span>
            </label>
            <div className="mt-1.5 flex overflow-hidden rounded-lg border border-border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="flex items-center gap-1 border-r border-border bg-muted px-3 text-[13px] font-semibold text-muted-foreground">
                +91 <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
              </span>
              <input
                id="bkPhone"
                name="phone"
                type="tel"
                required
                className="w-full px-3.5 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/70"
                placeholder="Enter your phone"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bkDate" className="text-[12.5px] font-semibold">
                Start Date <span className="text-badge-red">*</span>
              </label>
              <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <input
                  id="bkDate"
                  name="start_date"
                  required
                  className="w-full px-3 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/70"
                  placeholder="Select date"
                  onFocus={(e) => (e.target.type = 'date')}
                />
                <svg viewBox="0 0 24 24" className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
            </div>
            <div>
              <label htmlFor="bkPax" className="text-[12.5px] font-semibold">
                Travellers <span className="text-badge-red">*</span>
              </label>
              <select
                id="bkPax"
                name="travellers"
                defaultValue="2"
                className="mt-1.5 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6+</option>
              </select>
            </div>
          </div>
          <motion.button
            type="submit"
            className="!mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[14px] font-bold text-primary-foreground shadow-card transition hover:brightness-110"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Book Now — Pay 20% Advance
          </motion.button>
          <p className="text-center text-[11px] text-muted-foreground">
            Secure checkout via Razorpay · ₹7,000 advance for 2 travellers
          </p>
        </motion.form>
      </motion.div>

      {/* Trust List */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ul className="space-y-4 text-[13px]">
          {trustItems.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <div>
                <p className="font-bold">{item.t}</p>
                {item.s && <p className="text-[11.5px] text-muted-foreground">{item.s}</p>}
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Need Help */}
      <motion.a
        href="#"
        className="flex items-center gap-3.5 rounded-2xl bg-primary/10 p-5 transition hover:bg-primary/15"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.7 1.7c0 .2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2 1.1.9 2 .9 2.3 1 .2 0 .4 0 .5-.2l.6-.8c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.4.3.1.2.1.6-.1 1Z" />
          </svg>
        </span>
        <span>
          <span className="block text-[14px] font-bold text-foreground">Need Help?</span>
          <span className="block text-[12px] text-muted-foreground">Chat with our travel expert</span>
          <span className="mt-0.5 block text-[12.5px] font-bold text-primary">{helpPhone}</span>
        </span>
      </motion.a>

      {/* Info Cards */}
      <motion.div
        className="space-y-3.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {infoCards.map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={card.icon} />
              </svg>
            </span>
            <div>
              <p className="text-[13.5px] font-bold">{card.t}</p>
              <p className="text-[12px] text-muted-foreground">{card.s}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </aside>
  );
}