"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { LinkChecklist, type LinkOption } from "@/components/admin/activities/LinkChecklist";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { cn } from "@/lib/utils";

const PLACEMENT_OPTIONS = [
  { value: "HOME", label: "Homepage" },
  { value: "ABOUT", label: "About" },
  { value: "CONTACT", label: "Contact" },
  { value: "FAQ", label: "FAQ index (/faq)" },
  { value: "REVIEWS", label: "Reviews" },
] as const;

const faqSchema = z.object({
  question: z.string().min(3, "Question is required"),
  shortAnswer: z.string().min(1, "Short answer is required"),
  answer: z.string().min(1, "Full answer is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.boolean().default(false),
  placements: z.array(z.enum(["HOME", "ABOUT", "CONTACT", "FAQ", "REVIEWS"])).default([]),
  sortOrder: z.number().int().default(0),
  lastReviewedAt: z.string().default(""),
});

type FaqFormData = z.infer<typeof faqSchema>;

export interface FaqFormDefaults {
  id?: string;
  question?: string;
  shortAnswer?: string;
  answer?: string;
  categoryId?: string;
  status?: string;
  featured?: boolean;
  placements?: string[];
  sortOrder?: number;
  lastReviewedAt?: string | null;
  tourIds?: string[];
  destinationIds?: string[];
  blogIds?: string[];
  campaignIds?: string[];
  activityIds?: string[];
  slug?: string;
  usedOn?: { label: string; href: string }[];
}

interface FaqFormProps {
  defaults?: FaqFormDefaults;
  categoryOptions: LinkOption[];
  tourOptions: LinkOption[];
  destinationOptions: LinkOption[];
  blogOptions: LinkOption[];
  campaignOptions: LinkOption[];
  activityOptions: LinkOption[];
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="mb-1.5 text-foreground">
      {children}
      {required && <span className="text-accent ml-0.5">*</span>}
    </Label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 dark:text-red-400 text-xs mt-1">{message}</p>;
}

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-muted-foreground";

export function FaqForm({
  defaults,
  categoryOptions,
  tourOptions,
  destinationOptions,
  blogOptions,
  campaignOptions,
  activityOptions,
}: FaqFormProps) {
  const router = useRouter();
  const isEdit = Boolean(defaults?.id);

  const [tourIds, setTourIds] = useState<string[]>(defaults?.tourIds ?? []);
  const [destinationIds, setDestinationIds] = useState<string[]>(defaults?.destinationIds ?? []);
  const [blogIds, setBlogIds] = useState<string[]>(defaults?.blogIds ?? []);
  const [campaignIds, setCampaignIds] = useState<string[]>(defaults?.campaignIds ?? []);
  const [activityIds, setActivityIds] = useState<string[]>(defaults?.activityIds ?? []);
  const [placements, setPlacements] = useState<string[]>(defaults?.placements ?? []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(faqSchema) as any,
    defaultValues: {
      question: defaults?.question ?? "",
      shortAnswer: defaults?.shortAnswer ?? "",
      answer: defaults?.answer ?? "",
      categoryId: defaults?.categoryId ?? categoryOptions[0]?.id ?? "",
      status: (defaults?.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
      featured: defaults?.featured ?? false,
      sortOrder: defaults?.sortOrder ?? 0,
      lastReviewedAt: defaults?.lastReviewedAt
        ? new Date(defaults.lastReviewedAt).toISOString().slice(0, 10)
        : "",
    },
  });

  function togglePlacement(value: string) {
    setPlacements((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }

  async function onSubmit(data: FaqFormData) {
    const payload = {
      ...data,
      lastReviewedAt: data.lastReviewedAt || null,
      placements,
      tourIds,
      destinationIds,
      blogIds,
      campaignIds,
      activityIds,
    };

    const url = isEdit ? `/api/faqs/${defaults!.id}` : "/api/faqs";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 403) {
        toast.error("You don't have permission to save FAQs. Contact your administrator.");
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: unknown };
      const msg = typeof json.error === "string" ? json.error : "Save failed";
      toast.error(msg);
      return;
    }

    toast.success(isEdit ? "FAQ updated!" : "FAQ created!");
    router.push("/admin/faqs");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Content</h3>
            <div>
              <FieldLabel required>Question</FieldLabel>
              <Input
                {...register("question")}
                placeholder="e.g. Is Kashmir safe for family travel?"
              />
              <FieldError message={errors.question?.message} />
              {isEdit && defaults?.slug && (
                <p className="text-[12px] text-muted-foreground mt-1">
                  Anchor: /faq#{defaults.slug} — set once at creation, not changed by editing the
                  question.
                </p>
              )}
            </div>
            <div>
              <FieldLabel required>Short Answer</FieldLabel>
              <p className="text-[12px] text-muted-foreground mb-1.5">
                Shown on Homepage, Tour, Destination, About and Contact — never the full answer.
                Keep it to 1–2 sentences.
              </p>
              <textarea
                {...register("shortAnswer")}
                rows={2}
                className={cn(inputCls, "resize-none")}
              />
              <FieldError message={errors.shortAnswer?.message} />
            </div>
            <div>
              <FieldLabel required>Full Answer</FieldLabel>
              <p className="text-[12px] text-muted-foreground mb-1.5">
                Shown only on this FAQ&apos;s own detail page.
              </p>
              <textarea {...register("answer")} rows={6} className={cn(inputCls, "resize-none")} />
              <FieldError message={errors.answer?.message} />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Attach to specific records</h3>
            <p className="text-[12px] text-muted-foreground -mt-2">
              Optional. A FAQ can attach to any number of Tours, Destinations, Blog posts,
              Campaigns, or Activities — it still exists once and is shown wherever it&apos;s
              attached, never duplicated.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LinkChecklist
                title="Tours"
                options={tourOptions}
                value={tourIds}
                onChange={setTourIds}
              />
              <LinkChecklist
                title="Destinations"
                options={destinationOptions}
                value={destinationIds}
                onChange={setDestinationIds}
              />
              <LinkChecklist
                title="Blog Posts"
                options={blogOptions}
                value={blogIds}
                onChange={setBlogIds}
              />
              <LinkChecklist
                title="Campaigns"
                options={campaignOptions}
                value={campaignIds}
                onChange={setCampaignIds}
              />
              <LinkChecklist
                title="Activities"
                options={activityOptions}
                value={activityIds}
                onChange={setActivityIds}
              />
            </div>
          </div>

          {isEdit && defaults?.usedOn && defaults.usedOn.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-foreground text-sm">Currently appears on</h3>
              <p className="text-[12px] text-muted-foreground -mt-1">
                Computed live from the relations above and the placements to the right — not a
                separately stored value.
              </p>
              <ul className="flex flex-wrap gap-2">
                {defaults.usedOn.map((u) => (
                  <li key={u.href}>
                    <a
                      href={u.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full bg-muted px-3 py-1 text-[12px] font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {u.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Organize</h3>
            <div>
              <FieldLabel required>Category</FieldLabel>
              <select {...register("categoryId")} className={inputCls}>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.categoryId?.message} />
            </div>
            <div>
              <FieldLabel required>Status</FieldLabel>
              <select {...register("status")} className={inputCls}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" {...register("featured")} className="h-4 w-4 accent-primary" />
              <span className="text-sm font-medium text-foreground">Featured</span>
            </label>
            <div>
              <FieldLabel>Sort Order</FieldLabel>
              <Input type="number" {...register("sortOrder", { valueAsNumber: true })} />
            </div>
            <div>
              <FieldLabel>Last Reviewed</FieldLabel>
              <Input type="date" {...register("lastReviewedAt")} />
              <p className="text-[12px] text-muted-foreground mt-1">
                Optional freshness signal — not updated automatically.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-foreground text-sm">Site Placement</h3>
            <p className="text-[12px] text-muted-foreground -mt-1">
              Fixed sections to also show this FAQ&apos;s short answer on. Independent of the record
              attachments above.
            </p>
            <div className="space-y-2">
              {PLACEMENT_OPTIONS.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={placements.includes(p.value)}
                    onChange={() => togglePlacement(p.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? "Save Changes" : "Create FAQ"}
          </Button>
        </div>
      </div>
    </form>
  );
}
