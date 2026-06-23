// src/components/campaign/CampaignHero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Star, Check, Lock, Phone } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';

interface CampaignHeroProps {
  badge: string | null;
  titleHTML: string | null;
  sub: string | null;
  facts: string[];
  heroCta: string;
  proofCount: string | null;
  filmDur: string | null;
  heroImage: string | null;
  heroImageMobile: string | null;
  particles: 'snow' | 'embers';
  phone: string | null;
  onFilmClick: () => void;
}

// Fixed dark "glass" — the hero sits over a dark image overlay in both themes.
const darkGlass = 'border border-white/15 bg-white/10 backdrop-blur-xl';

export function CampaignHero({
  badge,
  titleHTML,
  sub,
  facts,
  heroCta,
  proofCount,
  filmDur,
  heroImage,
  heroImageMobile,
  particles,
  phone,
  onFilmClick,
}: CampaignHeroProps) {
  const embersRef = useRef<HTMLDivElement>(null);
  const flakesRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const createParticles = (container: HTMLDivElement, className: string, count: number, isEmber: boolean) => {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('i');
        el.className = className;
        const z = Math.random();
        if (isEmber) {
          el.style.cssText += `left:${Math.random() * 100}%;bottom:${Math.random() * 30}%;width:${2 + Math.random() * 3}px;height:${2 + Math.random() * 3}px;animation-duration:${5 + Math.random() * 7}s;animation-delay:-${Math.random() * 7}s`;
        } else {
          el.style.cssText += `left:${Math.random() * 100}%;top:${-Math.random() * 20}%;width:${2 + z * 3.5}px;height:${2 + z * 3.5}px;opacity:${0.3 + z * 0.55};animation-duration:${8 + Math.random() * 11}s;animation-delay:-${Math.random() * 12}s`;
        }
        container.appendChild(el);
      }
    };
    if (particles === 'snow' && flakesRef.current) createParticles(flakesRef.current, 'flake', 30, false);
    if (particles === 'embers' && embersRef.current) createParticles(embersRef.current, 'ember', 30, true);
  }, [particles]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const phoneVal = String(fd.get('phone') ?? '').trim();
    if (name.length < 2 || phoneVal.length < 6) {
      toast.error('Please enter your name and a valid phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const travellers = String(fd.get('travellers') ?? '');
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phoneVal,
          travellers: travellers && /^\d+$/.test(travellers) ? Number(travellers) : undefined,
          source: 'campaign',
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success("Reserved! We'll call you back within 30 minutes.");
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative z-[2] -mt-[76px] min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        {heroImage && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.14 }}
            transition={{ duration: 16, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          >
            <picture className="block h-full w-full">
              {heroImageMobile && (
                <source media="(max-width: 640px)" srcSet={heroImageMobile} />
              )}
              <img
                src={heroImage}
                alt="Campaign hero"
                className="kb h-full w-full object-cover"
              />
            </picture>
          </motion.div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg,hsl(202 50% 5% / .92) 8%,hsl(202 50% 5% / .55) 45%,hsl(202 50% 5% / .25) 75%)' }}></div>
        <div className="absolute inset-x-0 bottom-0 h-48" style={{ background: 'linear-gradient(transparent,hsl(202 50% 5%))' }}></div>
        <div id="particles" className="absolute inset-0">
          <div ref={particles === 'snow' ? flakesRef : embersRef} className="absolute inset-0"></div>
        </div>
      </div>

      <div className="relative z-[2] mx-auto grid min-h-[100svh] max-w-[1300px] items-center gap-10 px-6 pb-16 pt-36 lg:grid-cols-[1.15fr_370px]">
        <div>
          {badge && (
            <motion.span
              className={`${darkGlass} inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold tracking-[0.16em] text-white`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {badge}
            </motion.span>
          )}
          {titleHTML && (
            <motion.h1
              className="h-display mt-6 max-w-2xl text-[42px] font-extrabold text-white sm:text-[58px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              dangerouslySetInnerHTML={{ __html: titleHTML }}
            />
          )}
          {sub && (
            <motion.p
              className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {sub}
            </motion.p>
          )}

          {facts.length > 0 && (
            <motion.div
              className="mt-7 flex flex-wrap gap-2.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {facts.map((fact, i) => (
                <span key={i} className={`${darkGlass} rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white`}>
                  {fact}
                </span>
              ))}
            </motion.div>
          )}

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              href="#pricing"
              className="sweep inline-flex items-center gap-2 rounded-full bg-accent-grad px-8 py-4 text-[14px] font-extrabold text-white ring-inner shadow-glow transition hover:scale-[1.03]"
            >
              {heroCta} →
            </Link>
            {filmDur && (
              <button
                onClick={onFilmClick}
                className={`${darkGlass} inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[13.5px] font-semibold text-white transition hover:scale-[1.03] hover:bg-white/15`}
              >
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white text-[hsl(202_50%_8%)]">
                  <span className="ml-0.5 text-[10px]">▶</span>
                </span>
                Watch the film <span className="text-white/55">· {filmDur}</span>
              </button>
            )}
          </motion.div>

          {proofCount && (
            <motion.div
              className="mt-9 flex flex-wrap items-center gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex -space-x-2.5">
                {['sp1', 'sp2', 'sp3'].map((s) => (
                  <img key={s} className="h-9 w-9 rounded-full border-2 border-[hsl(202_50%_6%)] object-cover" src={imgSrc()} alt="" />
                ))}
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(202_50%_6%)] bg-accent-grad text-[10px] font-extrabold text-white">2k+</span>
              </div>
              <p className="text-[12.5px] leading-snug text-white/70">
                <span className="inline-flex items-center gap-1 font-bold text-amber-300"><Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} /> 4.9</span> from{' '}
                <span className="font-bold text-white">{proofCount}</span> travellers on this trip last season
              </p>
            </motion.div>
          )}
        </div>

        <div id="reserve" className="scroll-mt-28">
          <motion.div
            className="relative rounded-3xl border border-white/12 bg-[hsl(202_50%_8%/0.6)] p-6 shadow-glass backdrop-blur-xl"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.2em] text-camp-accent">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--camp-accent)' }}></span>
              PLAN YOUR TRIP
            </p>
            <h2 className="h-display mt-3 text-[23px] font-bold leading-snug text-white">Get a quote in 60 seconds</h2>
            <p className="mt-1.5 text-[12.5px] text-white/60">Free callback from our local expert within 30 minutes.</p>

            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent-grad text-white"><Check className="h-6 w-6" strokeWidth={2.5} /></div>
                <p className="text-[15px] font-bold text-white">Request received!</p>
                <p className="mt-1 text-[12.5px] text-white/60">We&apos;ll call you back shortly.</p>
              </div>
            ) : (
              <form className="mt-5 space-y-3" onSubmit={handleSubmit} noValidate>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-[13px] text-white outline-none transition placeholder:text-white/45 focus:bg-white/10 focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--camp-accent)' } as React.CSSProperties}
                  placeholder="Your Name *"
                />
                <input
                  name="phone"
                  type="tel"
                  required
                  className="w-full rounded-xl border border-white/12 bg-white/[.06] px-4 py-3 text-[13px] text-white outline-none transition placeholder:text-white/45 focus:bg-white/10 focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--camp-accent)' } as React.CSSProperties}
                  placeholder="Phone Number *"
                />
                <select
                  name="travellers"
                  defaultValue=""
                  className="w-full appearance-none rounded-xl border border-white/12 bg-white/[.06] px-3 py-3 text-[12.5px] text-white/60 outline-none transition focus:bg-white/10 focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--camp-accent)' } as React.CSSProperties}
                >
                  <option value="" className="text-black">Travellers</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n} className="text-black">{n}</option>
                  ))}
                  <option value="5" className="text-black">5+</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="sweep flex w-full items-center justify-center gap-2 rounded-xl bg-accent-grad py-3.5 text-[14px] font-extrabold text-white ring-inner shadow-glow transition hover:brightness-110 disabled:opacity-60"
                >
                  {submitting ? 'Reserving…' : 'Reserve My Seat →'}
                </button>
              </form>
            )}
            <p className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10.5px] font-semibold text-white/55">
              <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" strokeWidth={2.2} /> Razorpay secured</span>
              <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" strokeWidth={2.5} /> J&amp;K licensed</span>
              {phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" strokeWidth={2.2} /> {phone}</span>}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
