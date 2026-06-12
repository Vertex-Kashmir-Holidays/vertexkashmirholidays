'use client';

export function WhyChooseSection() {
  const why = [
    { e: '🏔️', t: 'Born in Kashmir', d: 'Our team is from Srinagar, Pahalgam & Gulmarg — not a Delhi call centre.' },
    { e: '💎', t: 'Transparent Pricing', d: 'What you see is what you pay. No hidden driver tip or gondola extra.' },
    { e: '🗺️', t: 'Honest Itineraries', d: "We tell you what's worth skipping. Real days. Real time." },
    { e: '🛟', t: 'Hassle-free Travel', d: '24/7 on-ground support. Verified hotels. Sanitised cars.' },
  ];

  return (
    <section id="why" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="text-center">
        <p className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow">WHY CHOOSE VERTEX KASHMIR</p>
        <h2 className="rv h-display mt-3 text-4xl font-bold text-white" style={{ '--rd': '0.08s' } as any}>
          We live here. So your trip <span className="grad-text-cool italic">actually works.</span>
        </h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {why.map((w, i) => (
          <article key={i} className="rv tilt glass relative rounded-3xl p-6 text-center shadow-card" data-tilt style={{ '--rd': `${i * 0.08}s` } as any}>
            <div className="shine"></div>
            <div className="pop">
              <span className="glass-strong mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow-card">
                {w.e}
              </span>
              <h3 className="mt-5 font-bold text-white">{w.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">{w.d}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}