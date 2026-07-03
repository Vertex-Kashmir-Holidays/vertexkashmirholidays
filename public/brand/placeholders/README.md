# Vertex Kashmir Holidays — Branded Placeholders

Graceful, on-brand fallbacks for any missing/not-yet-uploaded image. They read as
intentional brand art (mountain silhouette + Vertex mark), so they're safe to ship as
permanent fallbacks — not "broken image" boxes.

## Contents
svg/  (scalable, tiny — preferred)
  placeholder-16x9-{dark,light}.svg   → tour/blog/offer cards, wide heroes
  placeholder-4x3-{dark,light}.svg    → general content
  placeholder-1x1-{dark,light}.svg    → square tiles, gallery
  placeholder-3x4-{dark,light}.svg    → portrait cards
  placeholder-9x16-{dark,light}.svg   → video-review / story cards
  avatar-{navy,blue,green,gold,slate}.svg → person/testimonial/review avatars
png/  raster exports (use when SVG isn't possible)

Use the DARK variant on navy surfaces, LIGHT on golden surfaces.

## Wiring (Next.js)
Image with onError fallback:

```tsx
'use client';
import { useState } from 'react';

export function SafeImage({ src, alt, ratio = '16x9', dark = false, ...rest }) {
  const fallback = `/placeholders/placeholder-${ratio}-${dark ? 'dark' : 'light'}.svg`;
  const [img, setImg] = useState(src || fallback);
  return <img src={img} alt={alt} onError={() => setImg(fallback)} {...rest} />;
}
```

Deterministic avatar (same person → same colour every time):

```ts
const TINTS = ['navy','blue','green','gold','slate'];
export function avatarFor(key: string) {
  let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `/placeholders/avatar-${TINTS[h % TINTS.length]}.svg`;
}
// <img src={person.photo || avatarFor(person.name)} ... />
```

Place the files under `public/placeholders/` (or `public/brand/kit/placeholders/`)
and reference by URL. Pick dark/light from the current theme.

Brand colours: navy #0B1F3A · blue #0A4DA2 · green #0BA45B · gold #C2A14E · cream #F8F1DD
