import { headers } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteAnalytics } from "@/components/providers/SiteAnalytics";

// login/page.tsx already calls auth() directly and sets `dynamic = "force-dynamic"`,
// so this route is fully dynamic regardless — reading the CSP nonce via
// headers() here costs nothing extra. GTM loads on /login today (only /admin
// is excluded), so <SiteAnalytics> is included here to match that exactly.
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <SiteAnalytics nonce={nonce} />
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
