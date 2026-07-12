import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { imgSrc } from "@/lib/placeholder";
import type { ReviewListItem } from "@/lib/reviews";

// Grid-friendly review card for the /reviews page — distinct from
// TestimonialsSection's card, which is sized/styled for a horizontal
// carousel, not a grid.
export function ReviewCard({ review }: { review: ReviewListItem }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <Image
          src={imgSrc(review.avatar)}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
          unoptimized
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{review.name}</p>
          <p className="text-[12px] text-muted-foreground">
            {review.createdAt.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </p>
        </div>
        <span className="ml-auto flex shrink-0 gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-3.5 w-3.5"
              strokeWidth={0}
              fill={i < review.rating ? "currentColor" : "none"}
            />
          ))}
        </span>
      </div>
      <p className="mt-3.5 line-clamp-5 flex-1 text-[14px] leading-relaxed text-foreground/80">
        {review.body}
      </p>
      {review.tourSlug && review.tourTitle && (
        <Link
          href={`/tours/${review.tourSlug}`}
          className="mt-3.5 truncate border-t border-border pt-3 text-[12px] font-semibold text-primary hover:underline"
        >
          Reviewed: {review.tourTitle}
        </Link>
      )}
    </article>
  );
}
