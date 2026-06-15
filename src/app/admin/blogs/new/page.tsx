import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BlogForm } from "@/components/admin/blogs/BlogForm";

export const metadata: Metadata = { title: "New Blog Post — Admin" };

export default function NewBlogPage() {
  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/blogs" className="hover:text-primary transition-colors">Blogs</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium">New Post</li>
        </ol>
      </nav>
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">New Blog Post</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Write a new article for the Kashmir blog</p>
      </div>
      <BlogForm />
    </div>
  );
}
