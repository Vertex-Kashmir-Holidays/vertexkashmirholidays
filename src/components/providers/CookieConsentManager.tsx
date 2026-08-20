"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/atoms/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/organisms/sheet";
import {
  getCookieConsent,
  setCookieConsent,
  onOpenCookiePreferences,
  type CookieConsent,
} from "@/lib/cookieConsent";

// Renders both the first-visit banner and the preferences Sheet (opened from
// the banner's "Manage" button, or from anywhere via openCookiePreferences()
// — see the Footer's "Cookie Preferences" link). GTMScript and
// AttributionCapture read the saved choice themselves via getCookieConsent()/
// onCookieConsentChange(); this component only owns the UI + the write side.
export function CookieConsentManager() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsentState] = useState<CookieConsent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [analyticsDraft, setAnalyticsDraft] = useState(false);

  useEffect(() => {
    setConsentState(getCookieConsent());
    setMounted(true);
  }, []);

  useEffect(
    () =>
      onOpenCookiePreferences(() => {
        setAnalyticsDraft(consent?.analytics ?? false);
        setSheetOpen(true);
      }),
    [consent],
  );

  function save(analytics: boolean) {
    setCookieConsent(analytics);
    setConsentState(getCookieConsent());
    setSheetOpen(false);
  }

  function openManage() {
    setAnalyticsDraft(consent?.analytics ?? false);
    setSheetOpen(true);
  }

  // Nothing renders until mounted (avoids a hydration-mismatch flash) or once
  // a decision is already on file and the sheet isn't being opened for review.
  const showBanner = mounted && consent === null && !sheetOpen;

  return (
    <>
      {showBanner && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4 lg:inset-x-0 lg:inset-y-auto lg:bottom-0 lg:block lg:p-0">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur lg:mx-auto lg:flex lg:max-w-[1300px] lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:px-6 lg:py-4">
            <p className="text-[13px] text-muted-foreground">
              We use cookies to keep the site working and, with your permission, to understand how
              visitors find us. See our{" "}
              <Link href="/privacy-policy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-3 flex shrink-0 items-center justify-center gap-2 lg:mt-0">
              <Button variant="outline" size="sm" onClick={openManage}>
                Manage
              </Button>
              <Button size="sm" onClick={() => save(true)}>
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Cookie className="h-4 w-4" /> Cookie Preferences
            </SheetTitle>
            <SheetDescription>
              Choose which cookies we&apos;re allowed to use. You can change this anytime from the
              link in the footer.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-bold text-foreground">Necessary</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Required for login, booking, and core site functionality. Always on.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                Always On
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-bold text-foreground">Analytics &amp; Attribution</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lets us see which pages and ad campaigns bring visitors, via Google Tag Manager
                  and a first-touch attribution cookie.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analyticsDraft}
                aria-label="Analytics & Attribution cookies"
                onClick={() => setAnalyticsDraft((v) => !v)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  analyticsDraft ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    analyticsDraft ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => save(false)}>
              Reject Non-Essential
            </Button>
            <Button onClick={() => save(analyticsDraft)}>Save Preferences</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
