'use client';

export function TestimonialsSection() {
  const tests = [
    { seed: 't1', n: 'Ananya Iyer', loc: 'Chennai · Honeymoon, May 2026', q: 'Our planner Bilal redid the whole itinerary when it rained in Pahalgam — we ended up in Doodhpathri and it was the best day of the trip.' },
    { seed: 't2', n: 'Vikram Mehta', loc: 'Mumbai · Family Trip, Apr 2026', q: 'Travelling with my parents and a toddler, I needed zero surprises. Hotels matched photos exactly, driver was a saint, and pricing was to the rupee.' },
    { seed: 't3', n: 'Sarah Thomas', loc: 'Bengaluru · Great Lakes Trek', q: 'Camps, mules, permits — everything was handled. The local guides knew every shortcut and every shepherd on the route.' },
    { seed: 't4', n: 'Arjun & Kavya', loc: 'Hyderabad · Signature Luxury', q: 'The heritage houseboat with a private chef felt unreal. They even arranged a saffron-farm visit on a random request.' },
    { seed: 't5', n: 'Neha Kapoor', loc: 'Delhi · Solo, Mar 2026', q: 'As a solo woman traveller I got daily check-ins on WhatsApp. Felt safer in Srinagar than in my own city, honestly.' },
  ];

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('trow');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 340;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  return (
    <section id="testimonials" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow">TESTIMONIALS</p>
          <h2 className="rv h-display mt-3 text-4xl font-bold text-white" style={{ '--rd': '0.08s' } as any}>
            12,000 travellers can't be wrong
          </h2>
        </div>
        <div className="rv flex gap-2" style={{ '--rd': '0.16s' } as any}>
          <button
            onClick={() => scroll('prev')}
            className="glass grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/15"
          >
            ←
          </button>
          <button
            onClick={() => scroll('next')}
            className="glass grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/15"
          >
            →
          </button>
        </div>
      </div>
      <div id="trow" className="snap-row mt-9 flex gap-5 overflow-x-auto pb-4">
        {tests.map((t, i) => (
          <article key={i} className="rv glass relative w-[340px] shrink-0 rounded-3xl p-6 shadow-card" style={{ '--rd': `${i * 0.07}s` } as any}>
            <p className="font-display text-5xl leading-none text-green-glow/60">"</p>
            <p className="mt-2 text-[14px] leading-relaxed text-white/75">{t.q}</p>
            <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
              <img src={`https://picsum.photos/seed/${t.seed}/80`} alt="" className="h-10 w-10 rounded-full border border-white/20 object-cover" />
              <div>
                <p className="text-sm font-bold text-white">{t.n}</p>
                <p className="text-[11px] text-white/50">{t.loc}</p>
              </div>
              <span className="ml-auto text-amber-300">★★★★★</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}