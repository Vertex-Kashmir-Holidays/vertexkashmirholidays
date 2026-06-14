// src/components/blog/BlogPostBody.tsx

// Renders a blog post's stored HTML body with theme-aware, prose-like styling.
// (The project has no @tailwindcss/typography, so styles are hand-rolled via
// arbitrary child selectors.)
interface BlogPostBodyProps {
  html: string;
}

export function BlogPostBody({ html }: BlogPostBodyProps) {
  return (
    <div
      className="
        max-w-none text-[15px] leading-[1.8] text-foreground/85
        [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-28 [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:text-foreground
        [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-foreground
        [&_p]:my-4
        [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
        [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
        [&_li]:text-foreground/85 [&_li]:marker:text-primary
        [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline
        [&_strong]:font-bold [&_strong]:text-foreground
        [&_img]:my-6 [&_img]:rounded-xl
        [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
