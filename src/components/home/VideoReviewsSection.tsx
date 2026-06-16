'use client';

import { useState } from 'react';
import Image from 'next/image';
import { renderAccents } from '@/lib/accents';
import type { SectionHeading, VideoReviewData } from '@/types/home';

interface VideoReviewsSectionProps {
  heading: SectionHeading;
  videos: VideoReviewData[];
}

// Map a stored video URL to something playable. YouTube/Vimeo links become
// embeddable iframe URLs; anything else is treated as a direct video file.
function resolveVideo(url: string): { kind: 'iframe' | 'file'; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  return { kind: 'file', src: url };
}

export function VideoReviewsSection({ heading, videos }: VideoReviewsSectionProps) {
  // Id of the card currently playing inline (only one plays at a time).
  const [playingId, setPlayingId] = useState<string | null>(null);

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('vrow');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 260;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  if (videos.length === 0) return null;

  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
          <h2 className="rv h-display mt-3 text-3xl sm:text-4xl font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
            {renderAccents(heading.title)}
          </h2>
          {heading.subtitle && (
            <p className="rv mt-3 max-w-md text-sm text-muted-foreground" style={{ '--rd': '0.14s' } as React.CSSProperties}>
              {heading.subtitle}
            </p>
          )}
        </div>
        <div className="rv flex gap-2" style={{ '--rd': '0.2s' } as React.CSSProperties}>
          <button
            onClick={() => scroll('prev')}
            className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
          >
            ←
          </button>
          <button
            onClick={() => scroll('next')}
            className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
          >
            →
          </button>
        </div>
      </div>
      <div id="vrow" className="snap-row mt-8 flex gap-5 overflow-x-auto pb-4">
        {videos.map((v, i) => {
          const isPlaying = playingId === v.id && !!v.videoUrl;
          const resolved = v.videoUrl ? resolveVideo(v.videoUrl) : null;
          return (
            <article
              key={v.id}
              className="rv group relative h-[420px] w-[240px] shrink-0 overflow-hidden rounded-3xl border border-border shadow-card"
              style={{ '--rd': `${i * 0.07}s` } as React.CSSProperties}
            >
              {isPlaying && resolved ? (
                <>
                  {resolved.kind === 'iframe' ? (
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={resolved.src}
                      title={`${v.name} video review`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      className="absolute inset-0 h-full w-full bg-black object-contain"
                      src={resolved.src}
                      poster={v.thumbnail}
                      controls
                      autoPlay
                      playsInline
                    />
                  )}
                  <button
                    onClick={() => setPlayingId(null)}
                    aria-label="Close video"
                    className="glass absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full text-white transition hover:bg-foreground/20"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <Image
                    src={v.thumbnail}
                    alt={`${v.name} video review`}
                    fill
                    sizes="240px"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30"></div>
                  {v.duration && (
                    <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white">
                      ▶ {v.duration}
                    </span>
                  )}
                  <button
                    aria-label={`Play ${v.name}'s video review`}
                    onClick={() => v.videoUrl && setPlayingId(v.id)}
                    disabled={!v.videoUrl}
                    className="glass-strong absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xl text-white transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 disabled:group-hover:scale-100 disabled:group-hover:bg-transparent disabled:group-hover:text-white"
                  >
                    ▶
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-sm font-bold text-white">{v.name}</p>
                    <p className="text-[11px] text-white/65">{v.place}</p>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
