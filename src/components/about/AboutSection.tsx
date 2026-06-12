'use client';

import Link from 'next/link';

export function AboutSection() {
  return (
    <section id="about" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="glass relative overflow-hidden rounded-[2rem] p-8 lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-bright/15 blur-3xl"></div>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow">ABOUT US</p>
            <h2 className="rv h-display mt-3 text-4xl font-bold text-white" style={{ '--rd': '0.08s' } as any}>
              Born in Srinagar.<br />
              <span className="grad-text-cool italic">Zero middlemen.</span>
            </h2>
            <p className="rv mt-5 text-[15px] leading-relaxed text-white/70" style={{ '--rd': '0.14s' } as any}>
              Vertex Kashmir Holidays is a locally based travel company run by people who grew up between Dal Lake and
              Gulmarg's meadows. We design every trip ourselves — no resellers, no Delhi call centres, no commissions
              stacked on your bill.
            </p>
            <p className="rv mt-4 text-[15px] leading-relaxed text-white/70" style={{ '--rd': '0.2s' } as any}>
              From honeymoon shikaras to Great Lakes treks, your itinerary is built by a neighbour, not an algorithm —
              and we stay on call 24/7 while you're in the valley.
            </p>
            <div className="rv mt-7 grid grid-cols-3 gap-4" style={{ '--rd': '0.26s' } as any}>
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-xl font-extrabold text-white" data-count="15" data-suffix="+">0</p>
                <p className="mt-1 text-[10px] text-white/55">Years on Ground</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-xl font-extrabold text-white" data-count="120" data-suffix="+">0</p>
                <p className="mt-1 text-[10px] text-white/55">Local Partners</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-xl font-extrabold text-white">24/7</p>
                <p className="mt-1 text-[10px] text-white/55">On-trip Support</p>
              </div>
            </div>
            <Link
              href="#"
              className="rv mt-8 inline-flex items-center gap-2 rounded-full bg-green-bright px-7 py-3.5 text-sm font-bold text-navy-brand shadow-glow ring-inner transition hover:scale-[1.03]"
              style={{ '--rd': '0.32s' } as any}
            >
              Meet the Team →
            </Link>
          </div>
          <div className="rv relative h-[420px]" style={{ '--rd': '0.18s' } as any} data-depth-group>
            <img
              src="https://picsum.photos/seed/about-dal/520/640"
              alt="Dal Lake"
              className="absolute left-0 top-6 h-[320px] w-[62%] rounded-3xl border border-white/15 object-cover shadow-card"
              data-depth
              style={{ '--d': '0.6' } as any}
            />
            <img
              src="https://picsum.photos/seed/about-gulmarg/420/420"
              alt="Gulmarg"
              className="absolute bottom-0 right-0 h-[230px] w-[52%] rounded-3xl border border-white/15 object-cover shadow-card"
              data-depth
              style={{ '--d': '1.1' } as any}
            />
            <div className="glass-strong absolute right-4 top-2 rounded-2xl px-5 py-4 shadow-card" data-depth style={{ '--d': '1.6' } as any}>
              <p className="text-2xl">🏔️</p>
              <p className="mt-1 text-xs font-bold text-white">Srinagar HQ</p>
              <p className="text-[10px] text-white/55">Boulevard Road, Dal Gate</p>
            </div>
            <div className="glass-strong absolute -bottom-3 left-6 rounded-2xl px-5 py-4 shadow-card" data-depth style={{ '--d': '1.3' } as any}>
              <p className="text-xs font-bold text-white">★ 4.9 Google Rating</p>
              <p className="text-[10px] text-white/55">1,800+ verified reviews</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}