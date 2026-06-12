'use client';

export function VideoReviewsSection() {
  const videos = [
    { seed: 'vid-honeymoon', name: 'Aarav & Meera', place: 'Honeymoon · Pahalgam', dur: '0:42' },
    { seed: 'vid-family', name: 'The Sharma Family', place: 'Snow Day · Gulmarg', dur: '1:05' },
    { seed: 'vid-trek', name: 'Rohit', place: 'Great Lakes Trek', dur: '0:58' },
    { seed: 'vid-shikara', name: 'Fatima & Zoya', place: 'Shikara Morning · Dal Lake', dur: '0:36' },
    { seed: 'vid-ski', name: 'Daniel', place: 'Skiing · Apharwat Peak', dur: '1:12' },
    { seed: 'vid-tulip', name: 'Priya', place: 'Tulip Garden · Srinagar', dur: '0:47' },
  ];

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('vrow');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 260;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-green-glow">REAL TRAVELLERS, REAL FOOTAGE</p>
          <h2 className="rv h-display mt-3 text-4xl font-bold text-white" style={{ '--rd': '0.08s' } as any}>
            Watch their <span className="grad-text-cool italic">Kashmir</span> moments
          </h2>
          <p className="rv mt-3 max-w-md text-sm text-white/60" style={{ '--rd': '0.14s' } as any}>
            Unscripted video reviews straight from the valley — shikara mornings, gondola rides and snow days.
          </p>
        </div>
        <div className="rv flex gap-2" style={{ '--rd': '0.2s' } as any}>
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
      <div id="vrow" className="snap-row mt-8 flex gap-5 overflow-x-auto pb-4">
        {videos.map((v, i) => (
          <article
            key={i}
            className="rv group relative h-[420px] w-[240px] shrink-0 overflow-hidden rounded-3xl border border-white/12 shadow-card"
            style={{ '--rd': `${i * 0.07}s` } as any}
          >
            <img
              src={`https://picsum.photos/seed/${v.seed}/480/840`}
              alt={`${v.name} video review`}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30"></div>
            <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white">
              ▶ {v.dur}
            </span>
            <button
              aria-label="Play video"
              className="glass-strong absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xl text-white transition duration-300 group-hover:scale-110 group-hover:bg-green-bright group-hover:text-navy-brand"
            >
              ▶
            </button>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-sm font-bold text-white">{v.name}</p>
              <p className="text-[11px] text-white/65">{v.place}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}