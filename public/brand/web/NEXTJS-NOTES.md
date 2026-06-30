# Using these assets in Next.js 15 (App Router)

Recommended placement for the Vertex platform:

- `src/app/favicon.ico`            ← from favicon/favicon.ico
- `src/app/icon.svg`               ← from favicon/favicon.svg (auto <link rel=icon>)
- `src/app/apple-icon.png`         ← from app-icons/apple-touch-icon.png (rename)
- `public/icons/`                  ← all app-icons/*.png (PWA manifest references)
- `public/og/vertex-og-1200x630.png`
- `public/site.webmanifest`        ← from web/site.webmanifest

Next.js auto-detects `icon.svg`, `apple-icon.png`, and `favicon.ico` in the app dir,
so you can drop the manual <link> tags for those. Keep the manifest + theme-color
in your root `metadata` export:

```ts
export const metadata = {
  manifest: "/site.webmanifest",
  themeColor: "#0B1F3A",
  openGraph: { images: ["/og/vertex-og-1200x630.png"] },
};
```

Logo usage in components (per your brand rules):
- Logo 1 (icon mark) → favicon, PWA icons, loading screen, admin
- Light surfaces → vertex-logo-horizontal-light.svg (navy text)
- Dark surfaces  → vertex-logo-horizontal-dark.svg (white text)
