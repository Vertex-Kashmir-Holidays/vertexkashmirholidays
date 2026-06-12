// src/components/sections/AboutTeam.tsx
'use client';

import { motion } from 'framer-motion';

export function AboutTeam() {
  const team = [
    { seed: 'tm-aamir', n: 'Aamir Lone', role: 'Founder & CEO', d: 'Born and raised in Srinagar. Loves mountain roads and strong kahwa.' },
    { seed: 'tm-sara', n: 'Sara Rashid', role: 'Trip Designer', d: 'Curates experiences that feel personal and beautiful.' },
    { seed: 'tm-faisal', n: 'Faisal Ahmad', role: 'Head of Operations', d: 'Ensures every trip runs like clockwork.' },
    { seed: 'tm-iqra', n: 'Iqra Hamid', role: 'Guest Experience', d: 'Your first call, your best friend in Kashmir.' },
    { seed: 'tm-rahil', n: 'Rahil Mir', role: 'On-ground Lead', d: 'Mountains are his office, guests are his family.' },
  ];

  return (
    <section id="team" className="mx-auto max-w-[1300px] px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <div>
          <p className="text-[11.5px] font-bold tracking-[0.22em] text-brand-green2">OUR TEAM</p>
          <h2 className="h-display mt-3 font-display text-[30px] font-bold leading-snug">Locals. Explorers.<br/>Passionate Hosts.</h2>
        </div>
        <div className="scrollbar-none grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((m, i) => (
            <motion.article
              key={i}
              className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <img
                src={`https://picsum.photos/seed/${m.seed}/360/300`}
                alt={m.n}
                className="h-[120px] w-full object-cover"
              />
              <div className="p-3.5">
                <p className="text-[13.5px] font-bold leading-snug">{m.n}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-brand-green2">{m.role}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-brand-mute">{m.d}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
      <div className="mt-9 flex justify-center">
        <a href="#" className="rounded-lg border-[1.5px] border-brand-line bg-white px-6 py-2.5 text-[13px] font-semibold shadow-soft transition hover:border-brand-green2 hover:text-brand-green2">
          Meet Our Full Team
        </a>
      </div>
    </section>
  );
}