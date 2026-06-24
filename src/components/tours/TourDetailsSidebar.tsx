// src/components/sections/TourDetailsSidebar.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, ChevronDown, Calendar, Lock, Users, Car, BadgeCheck, Clock, type LucideIcon } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { useWhatsAppLink } from '@/components/providers/SiteSettingsProvider';
import { LeadForm } from '@/components/leads/LeadForm';

interface TourDetailsSidebarProps {
  price: number;
  oldPrice?: number;
  discountPct?: number;
  rating: number;
  reviews: number;
  tourId: string;
  tourName: string;
  /** Which lead forms to expose. Defaults to showing both. */
  formMode?: 'BOOKING_ONLY' | 'INQUIRY_ONLY' | 'BOTH';
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
  formMode = 'BOTH',
  bestTime,
  tourType,
  pickupDrop,
  helpPhone,
}: TourDetailsSidebarProps) {
  const showInquiry = formMode !== 'BOOKING_ONLY';
  const showBook = formMode !== 'INQUIRY_ONLY';
  const [activeTab, setActiveTab] = useState<'inquiry' | 'book'>(
    showInquiry ? 'inquiry' : 'book',
  );
  const wa = useWhatsAppLink();
  const helpHref = wa(`Hi! I'd like help with the "${tourName}" Kashmir tour. Please assist.`);

  const trustItems: { t: string; s?: string; Icon: LucideIcon }[] = [
    { t: 'Lowest Price Guarantee', Icon: BadgeCheck },
    { t: 'Secure Payments', s: 'Powered by Razorpay', Icon: Lock },
    { t: 'Free Cancellation', s: 'T&C Apply', Icon: Clock },
  ];

  const infoCards: { t: string; s: string; Icon: LucideIcon }[] = [
    { t: 'Best Time to Visit', s: bestTime, Icon: Calendar },
    { t: 'Tour Type', s: tourType, Icon: Users },
    { t: 'Pickup/Drop', s: pickupDrop, Icon: Car },
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
            <Star className="h-5 w-5 text-amber-400" fill="currentColor" strokeWidth={0} />
          </p>
          <div className="leading-tight">
            <p className="text-[13px] font-bold">Excellent</p>
            <p className="text-[11.5px] text-muted-foreground">{reviews.toLocaleString()} reviews</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-primary/10 px-4 py-3 text-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={2} />
          <p className="text-[12px] font-semibold leading-snug">
            Book with 20% advance to lock your dates
          </p>
        </div>

        {/* Tabs — only shown when both forms are enabled. */}
        {showInquiry && showBook && (
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
        )}

        {/* Inquiry Form — shared <LeadForm /> posting to /api/leads */}
        {showInquiry && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: activeTab === 'inquiry' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: activeTab === 'inquiry' ? 'block' : 'none' }}
        >
          <LeadForm
            source="tour-detail"
            context={{ tourName }}
            buttonLabel="Send Inquiry"
          />
        </motion.div>
        )}

        {/* Book Form */}
        {showBook && (
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
                +91 <ChevronDown className="h-3 w-3" strokeWidth={2.4} />
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
                <Calendar className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
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
            <Lock className="h-4 w-4" strokeWidth={2} />
            Book Now — Pay 20% Advance
          </motion.button>
          <p className="text-center text-[11px] text-muted-foreground">
            Secure checkout via Razorpay · ₹7,000 advance for 2 travellers
          </p>
        </motion.form>
        )}
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
              <item.Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
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
        href={helpHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3.5 rounded-2xl bg-primary/10 p-5 transition hover:bg-primary/15"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white">
          <WhatsAppIcon className="h-5 w-5" />
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
              <card.Icon className="h-5 w-5" strokeWidth={1.8} />
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