import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CollectionForm } from "@/components/admin/packages/CollectionForm";

export const metadata: Metadata = { title: "Edit Tour Collection — Admin" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditTourCollectionPage({ params }: Props) {
  const { id } = await params;
  const c = await prisma.tourCollection.findUnique({ where: { id } });
  if (!c) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link
              href="/admin/packages/collections"
              className="hover:text-primary transition-colors"
            >
              Tour Collections
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{c.name}</li>
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display font-extrabold text-foreground text-xl">
          Edit Tour Collection
        </h2>
        <a
          href={`/${c.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary font-semibold hover:underline shrink-0"
        >
          View Live ↗
        </a>
      </div>
      <CollectionForm
        defaults={{
          id: c.id,
          name: c.name,
          slug: c.slug,
          intro: c.intro ?? "",
          content: c.content ?? "",
          heroImage: c.heroImage ?? "",
          heroImageMobile: c.heroImageMobile ?? "",
          metaTitle: c.metaTitle ?? "",
          metaDesc: c.metaDesc ?? "",
          ogImage: c.ogImage ?? "",
          published: c.published,
          sortOrder: c.sortOrder,
        }}
      />
    </div>
  );
}
