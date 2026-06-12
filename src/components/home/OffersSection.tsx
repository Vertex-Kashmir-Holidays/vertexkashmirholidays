'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tilt3D } from '@/components/ui/3DTilt';

export function OffersSection() {
  const offers = [
    { seed: 'offer-monsoon', badge: 'SAVE 25%', t: 'Monsoon Escape Flash Sale', d: '5N/6D Srinagar + Gulmarg + Pahalgam. Houseboat night included.', p: '₹18,749', old: '₹24,999', ends: 'Ends June 30' },
    { seed: 'offer-honeymoon', badge: 'FREE SHIKARA', t: 'Honeymoon Early-Bird', d: 'Book 60 days ahead — candlelit shikara dinner + room upgrade free.', p: '₹31,499', old: '₹34,999', ends: 'July departures' },
    { seed: 'offer-group', badge: 'GROUP DEAL', t: 'Squad of 6+ Special', d: 'Tempo traveller, bonfire night & rafting add-on at no extra cost.', p: '₹16,999', old: '₹21,999', ends: 'Limited slots' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section id="offers" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            className="rv text-[11px] font-bold tracking-[0.22em] text-orange-brand"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            LIMITED-TIME OFFERS
          </motion.p>
          <motion.h2
            className="rv h-display mt-3 text-4xl font-bold text-white"
            style={{ '--rd': '0.08s' } as any}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Deals that melt <span className="grad-text-warm italic">faster than snow</span>
          </motion.h2>
        </div>
        <motion.p
          className="rv text-sm text-white/55"
          style={{ '--rd': '0.16s' } as any}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Monsoon window: June – September 2026
        </motion.p>
      </div>

      <motion.div
        className="mt-9 grid gap-6 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {offers.map((o, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Tilt3D intensity={6}>
              <article
                className="group relative overflow-hidden rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-orange-brand/20"
                style={{ background: 'linear-gradient(160deg,rgba(255,140,50,.12),rgba(8,26,20,.7))' }}
              >
                <div className="shine absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative h-40 overflow-hidden">
                  <motion.img
                    src={`https://picsum.photos/seed/${o.seed}/520/320`}
                    alt={o.t}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <motion.span
                    className="grad-orange pop-sm absolute left-3 top-3 rounded-lg px-3 py-1 text-[10px] font-extrabold text-white shadow-lg"
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ delay: i * 0.05 + 0.3 }}
                  >
                    {o.badge}
                  </motion.span>
                </div>
                
                <div className="pop-sm relative p-6">
                  <h3 className="h-display text-xl font-bold text-white">{o.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">{o.d}</p>
                  
                  <div className="mt-5 flex items-end justify-between">
                    <p>
                      <span className="text-[11px] text-white/40 line-through">{o.old}</span>
                      <br />
                      <span className="text-2xl font-extrabold text-orange-brand">{o.p}</span>
                      <span className="text-[10px] text-white/45"> /person</span>
                    </p>
                    <span className="glass rounded-full px-3 py-1.5 text-[10px] font-bold text-orange-200">
                      ⏳ {o.ends}
                    </span>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href="#"
                      className="grad-orange mt-5 block rounded-xl py-3 text-center text-xs font-extrabold text-white ring-inner transition-all duration-300 hover:brightness-110 hover:shadow-orange-glow"
                    >
                      Grab This Deal →
                    </Link>
                  </motion.div>
                </div>
              </article>
            </Tilt3D>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}