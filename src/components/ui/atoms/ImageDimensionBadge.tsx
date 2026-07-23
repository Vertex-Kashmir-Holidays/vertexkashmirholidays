import { cn } from "@/lib/utils";

interface Props {
  width: number;
  height: number;
  className?: string;
}

// Read from the already-loaded thumbnail's naturalWidth/naturalHeight — no
// upload/schema changes needed, and it works retroactively on every existing
// image regardless of source (Cloudinary or local disk).
export function ImageDimensionBadge({ width, height, className }: Props) {
  const isWide = width >= height;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none",
        isWide ? "bg-sky-600/80 text-white" : "bg-fuchsia-600/80 text-white",
        className,
      )}
      title={
        isWide
          ? "Landscape — suited for desktop hero images"
          : "Portrait — suited for mobile hero images"
      }
    >
      {width}×{height} · {isWide ? "Desktop" : "Mobile"}
    </span>
  );
}
