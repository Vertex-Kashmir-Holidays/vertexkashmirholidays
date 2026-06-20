"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-4 text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <Logo variant="auto" className="mb-10" />

        <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
          Something went wrong
        </p>

        <h1 className="h-display text-5xl font-bold mb-4">
          Unexpected{" "}
          <span className="grad-text-warm">detour.</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          An error occurred while loading this page. Our team has been
          notified. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="text-xs text-red-600 dark:text-red-400 bg-muted rounded-lg p-3 mb-8 w-full text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={reset}
            className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold px-6"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="px-6">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
