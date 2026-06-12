'use client';

import Link from 'next/link';

export function BlogSection() {
  const blogs = [
    { seed: 'blog-besttime', tag: 'Travel Guide', t: 'Best time to visit Kashmir: a month-by-month honest guide', d: 'Snow, tulips, or golden chinars — what each season actually feels like on the ground.', date: 'June 2, 2026', read: '7 min' },
    { seed: 'blog-packing', tag: 'Tips', t: 'What to pack for Gulmarg (and what to rent there instead)', d: 'Skip the heavy jackets. Here is what locals rent vs. what you must carry.', date: 'May 24, 2026', read: '5 min' },
    { seed: 'blog-food', tag: 'Food', t: 'A Wazwan crash course: 7 dishes you cannot leave without trying', d: 'From rogan josh to gushtaba — and where Srinagar locals actually eat them.', date: 'May 12, 2026', read: '6 min' },
  ];

  return (
    <section id="blogs" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow">FROM THE JOURNAL</p>
          <h2 className="rv h-display mt-3 text-4xl font-bold text-white" style={{ '--rd': '0.08s' } as any}>
            Stories &amp; guides from the valley
          </h2>
        </div>
        <Link href="#" className="rv text-sm font-bold text-green-glow hover:underline" style={{ '--rd': '0.16s' } as any}>
          Read the Blog →
        </Link>
      </div>
      <div className="mt-9 grid gap-6 md:grid-cols-3">
        {blogs.map((b, i) => (
          <article key={i} className="rv tilt glass group relative overflow-hidden rounded-3xl shadow-card" data-tilt style={{ '--rd': `${i * 0.09}s` } as any}>
            <div className="shine"></div>
            <div className="relative h-44 overflow-hidden">
              <img src={`https://picsum.photos/seed/${b.seed}/560/360`} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <span className="glass pop-sm absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white">
                {b.tag}
              </span>
            </div>
            <div className="pop-sm p-5">
              <p className="text-[11px] text-white/45">
                {b.date} · {b.read} read
              </p>
              <h3 className="mt-2 font-bold leading-snug text-white transition group-hover:text-green-glow">{b.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{b.d}</p>
              <p className="mt-4 text-xs font-bold text-green-glow">Read Article →</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}