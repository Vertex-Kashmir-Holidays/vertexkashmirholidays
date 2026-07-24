// src/components/blog/BlogFeaturedStory.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { imgSrc } from "@/lib/placeholder";
import type { BlogFeaturedData } from "@/types/blog";

interface BlogFeaturedStoryProps {
  story: BlogFeaturedData;
}

export function BlogFeaturedStory({ story }: BlogFeaturedStoryProps) {
  const meta = [story.dateLabel, story.readTime ? `${story.readTime} min read` : null]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[20px] font-bold">Featured Story</h2>
      <article className="mt-4 grid overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col p-6 lg:p-7">
          <span className="w-fit rounded-md bg-primary px-2.5 py-1 text-[12px] font-extrabold tracking-wide text-primary-foreground">
            FEATURED
          </span>
          <h3 className="mt-4 text-[24px] font-bold leading-snug">{story.title}</h3>
          {story.excerpt && (
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              {story.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            {story.authorImage && (
              <Image
                src={story.authorImage}
                alt={story.authorName ?? ""}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            )}
            <div className="leading-tight">
              {story.authorName && (
                <p className="text-[14px] font-semibold">
                  By <strong>{story.authorName}</strong>
                </p>
              )}
              {meta && <p className="text-[12px] text-muted-foreground">{meta}</p>}
            </div>
          </div>
          <Link
            href={`/blog/${story.slug}`}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110"
          >
            Read Full Story
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>
        <div className="relative min-h-[220px]">
          <Image
            src={imgSrc(story.image)}
            alt={story.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </article>
    </motion.div>
  );
}
