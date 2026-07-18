import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-4 text-foreground">
      {/* Background decoration */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-green/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <Logo variant="auto" className="mb-10" />

        <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
          404 — Page Not Found
        </p>

        <h1 className="h-display text-5xl sm:text-6xl font-bold mb-4 leading-tight">
          Lost in the <span className="grad-text-cool">mountains?</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          The page you&apos;re looking for has wandered off the trail. Let&apos;s get you back to
          base camp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            asChild
            className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold px-6"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="px-6">
            <Link href="/tours">
              <Compass className="mr-2 h-4 w-4" />
              Explore Tours
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
