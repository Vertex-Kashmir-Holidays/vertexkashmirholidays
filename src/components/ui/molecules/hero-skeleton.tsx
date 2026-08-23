import { Skeleton } from "@/components/ui/atoms/skeleton";

export interface HeroSkeletonProps {
  /** Mirrors SecondaryHero's `compact` band (half height). */
  compact?: boolean;
  /** Reserve the right-hand column SecondaryHero renders when a page passes `aside`. */
  aside?: boolean;
}

/**
 * Route-level placeholder for the public secondary hero. Deliberately mirrors
 * SecondaryHero's band — same `bg-brand-dark`, min-heights and nav-clearing
 * padding — so the real hero drops in without shifting the page. Bars are
 * tinted white rather than the Skeleton atom's `bg-muted`, which is invisible
 * against the dark band.
 */
function HeroSkeleton({ compact = false, aside = false }: HeroSkeletonProps) {
  const content = (
    <div className="min-w-0 space-y-4">
      <Skeleton className="h-3 w-32 bg-white/15" />
      <Skeleton className="h-9 w-3/4 max-w-lg bg-white/20 sm:h-11" />
      <Skeleton className="h-4 w-full max-w-md bg-white/15" />
      <Skeleton className="h-4 w-2/3 max-w-sm bg-white/15" />
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-brand-dark" aria-hidden>
      <div
        className={
          compact
            ? "relative mx-auto flex min-h-[190px] w-full max-w-[1300px] flex-col justify-center px-5 pt-28 pb-6 sm:px-6 sm:pt-32 sm:pb-8 lg:min-h-[230px]"
            : "relative mx-auto flex min-h-[380px] w-full max-w-[1300px] flex-col justify-center px-5 pt-28 pb-12 sm:px-6 sm:pt-32 sm:pb-16 lg:min-h-[460px]"
        }
      >
        {aside ? (
          <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_minmax(0,420px)]">
            {content}
            <div className="w-full max-w-md min-w-0 justify-self-center lg:justify-self-end">
              <Skeleton className="h-72 w-full rounded-2xl bg-white/15" />
            </div>
          </div>
        ) : (
          content
        )}
      </div>
    </section>
  );
}

export { HeroSkeleton };
