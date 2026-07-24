import type { OfflineConversionPlatform } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORM_BADGE_STYLES } from "@/lib/admin/offlineConversions";

/** Colored platform badge — reads from the shared label/style maps, so adding a new platform is one line there, zero changes here. */
export function PlatformBadge({
  platform,
  className,
}: {
  platform: OfflineConversionPlatform;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[12px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
        PLATFORM_BADGE_STYLES[platform],
        className,
      )}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  );
}
