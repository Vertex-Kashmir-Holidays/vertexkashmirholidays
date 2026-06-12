'use client';

import Link from 'next/link';

export function DestinationsSection() {
  const dests = [
    { seed: 'dest-gulmarg', t: 'Gulmarg', s: 'Meadow of flowers · Skiing', cls: 'md:col-span-2 md:row-span-2 h-[260px] md:h-full' },
    { seed: 'dest-pahalgam', t: 'Pahalgam', s: 'Lidder valley', cls: 'h-[200px]' },
    { seed: 'dest-sonmarg', t: 'Sonamarg', s: 'Meadow of gold', cls: 'h-[200px]' },
    { seed: 'dest-dallake', t: 'Dal Lake', s: 'Houseboats · Shikaras', cls: 'h-[200px]' },
    { seed: 'dest-doodhpathri', t: 'Doodhpathri', s: 'Valley of milk', cls: 'h-[200px]' },
  ];

  return (
    <section id="destinations" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow">DESTINATIONS</p>
          <h2 className="rv h-display mt-3 text-4xl font-bold text-white" style={{ '--rd': '0.08s' } as any}>
            Where the valley takes you
          </h2>
        </div>
        <Link href="#" className="rv text-sm font-bold text-green-glow hover:underline" style={{ '--rd': '0.16s' } as any}>
          View All Destinations →
        </Link>
      </div>
      <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
        {dests.map((d, i) => (
          <article key={i} className={`rv group relative overflow-hidden rounded-3xl border border-white/10 ${d.cls}`} style={{ '--rd': `${i * 0.07}s` } as any}>
            <img
              src={`https://picsum.photos/seed/${d.seed}/800/700`}
              alt={d.t}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
            <div className="absolute inset-x-0 bottom-0 p-5 transition duration-300 group-hover:-translate-y-1">
              <h3 className="h-display text-2xl font-bold text-white">{d.t}</h3>
              <p className="text-[12px] text-white/65">{d.s}</p>
            </div>
            <span className="glass absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-white opacity-0 transition duration-300 group-hover:opacity-100">
              →
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}