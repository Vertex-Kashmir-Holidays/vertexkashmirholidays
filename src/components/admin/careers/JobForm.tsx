"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { stringifyList } from "@/lib/tours/content";
import { EmploymentType } from "@prisma/client";

const listItemSchema = z.object({ value: z.string() });

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
];

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  department: z.string().min(1, "Department is required"),
  employmentType: z.nativeEnum(EmploymentType),
  experience: z.string().min(1, "Experience is required"),
  location: z.string().min(1, "Location is required"),
  salary: z.string().optional(),
  shortDescription: z.string().min(1, "Short description is required"),
  aboutRole: z.string().min(1, "About the role is required"),
  responsibilities: z.array(listItemSchema).default([]),
  requirements: z.array(listItemSchema).default([]),
  preferredSkills: z.array(listItemSchema).default([]),
  benefits: z.array(listItemSchema).default([]),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface JobFormDefaults {
  id?: string;
  title?: string;
  slug?: string;
  department?: string;
  employmentType?: EmploymentType;
  experience?: string;
  location?: string;
  salary?: string;
  shortDescription?: string;
  aboutRole?: string;
  responsibilities?: string[];
  requirements?: string[];
  preferredSkills?: string[];
  benefits?: string[];
  published?: boolean;
  metaTitle?: string;
  metaDesc?: string;
  ogImage?: string;
}

interface Props {
  defaults?: JobFormDefaults;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";

function ListFieldSection({
  title,
  fields,
  register,
  fieldName,
  onAdd,
  onRemove,
  placeholder,
  emptyLabel,
}: {
  title: string;
  fields: { id: string }[];
  register: ReturnType<typeof useForm<FormData>>["register"];
  fieldName: "responsibilities" | "requirements" | "preferredSkills" | "benefits";
  onAdd: () => void;
  onRemove: (i: number) => void;
  placeholder: string;
  emptyLabel: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-center">
            <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[12px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <input
              {...register(`${fieldName}.${i}.value`)}
              className={`${inputCls} flex-1`}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-muted-foreground/60 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {fields.length === 0 && <p className="text-xs text-muted-foreground py-2">{emptyLabel}</p>}
      </div>
    </div>
  );
}

export function JobForm({ defaults }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!defaults?.id;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: defaults?.title ?? "",
      slug: defaults?.slug ?? "",
      department: defaults?.department ?? "",
      employmentType: defaults?.employmentType ?? "FULL_TIME",
      experience: defaults?.experience ?? "",
      location: defaults?.location ?? "",
      salary: defaults?.salary ?? "",
      shortDescription: defaults?.shortDescription ?? "",
      aboutRole: defaults?.aboutRole ?? "",
      responsibilities: (defaults?.responsibilities ?? []).map((v) => ({ value: v })),
      requirements: (defaults?.requirements ?? []).map((v) => ({ value: v })),
      preferredSkills: (defaults?.preferredSkills ?? []).map((v) => ({ value: v })),
      benefits: (defaults?.benefits ?? []).map((v) => ({ value: v })),
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
    },
  });

  const {
    fields: responsibilityFields,
    append: addResponsibility,
    remove: removeResponsibility,
  } = useFieldArray({ control, name: "responsibilities" });
  const {
    fields: requirementFields,
    append: addRequirement,
    remove: removeRequirement,
  } = useFieldArray({ control, name: "requirements" });
  const {
    fields: skillFields,
    append: addSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: "preferredSkills" });
  const {
    fields: benefitFields,
    append: addBenefit,
    remove: removeBenefit,
  } = useFieldArray({ control, name: "benefits" });

  const titleVal = watch("title");
  useEffect(() => {
    if (!isEdit && titleVal) setValue("slug", slugify(titleVal));
  }, [titleVal, isEdit, setValue]);

  function onSubmit(data: FormData) {
    const { responsibilities, requirements, preferredSkills, benefits, ...rest } = data;
    const payload = {
      ...rest,
      responsibilities: stringifyList(responsibilities.map((v) => v.value).filter(Boolean)),
      requirements: stringifyList(requirements.map((v) => v.value).filter(Boolean)),
      preferredSkills: stringifyList(preferredSkills.map((v) => v.value).filter(Boolean)),
      benefits: stringifyList(benefits.map((v) => v.value).filter(Boolean)),
    };
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/careers/${defaults!.id}` : "/api/careers";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          if (res.status === 403) {
            toast.error("You don't have permission to save jobs. Contact your administrator.");
            return;
          }
          const err = (await res.json()) as {
            error?: string | { fieldErrors?: Record<string, string[]> };
          };
          const msg = typeof err.error === "string" ? err.error : "Save failed";
          toast.error(msg);
          return;
        }
        toast.success(isEdit ? "Job updated!" : "Job created! It's saved as a draft — publish it from the list.");
        router.push("/admin/careers");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Title *
                </label>
                <input
                  {...register("title")}
                  className={inputCls}
                  placeholder="e.g. Sales Executive"
                />
                {errors.title && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Slug *
                </label>
                <input
                  {...register("slug")}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. sales-executive"
                />
                {errors.slug && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                    {errors.slug.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Department *
                </label>
                <input
                  {...register("department")}
                  className={inputCls}
                  placeholder="e.g. Sales"
                />
                {errors.department && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                    {errors.department.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Employment Type *
                </label>
                <select {...register("employmentType")} className={inputCls}>
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Experience *
                </label>
                <input
                  {...register("experience")}
                  className={inputCls}
                  placeholder="e.g. 1-3 years"
                />
                {errors.experience && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                    {errors.experience.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Location *
                </label>
                <input
                  {...register("location")}
                  className={inputCls}
                  placeholder="e.g. Srinagar, J&K"
                />
                {errors.location && (
                  <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Salary
              </label>
              <input
                {...register("salary")}
                className={inputCls}
                placeholder="e.g. ₹25,000 - ₹35,000/month (optional)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Short Description *
              </label>
              <p className="text-[12px] text-muted-foreground mb-1">Shown on the listing card.</p>
              <textarea
                {...register("shortDescription")}
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="One or two lines summarizing the role..."
              />
              {errors.shortDescription && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                  {errors.shortDescription.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                About the Role *
              </label>
              <textarea
                {...register("aboutRole")}
                rows={5}
                className={`${inputCls} resize-none`}
                placeholder="Full role description..."
              />
              {errors.aboutRole && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                  {errors.aboutRole.message}
                </p>
              )}
            </div>
          </div>

          <ListFieldSection
            title="Responsibilities"
            fields={responsibilityFields}
            register={register}
            fieldName="responsibilities"
            onAdd={() => addResponsibility({ value: "" })}
            onRemove={removeResponsibility}
            placeholder="e.g. Manage the full sales pipeline from lead to close"
            emptyLabel="No responsibilities added yet."
          />

          <ListFieldSection
            title="Requirements"
            fields={requirementFields}
            register={register}
            fieldName="requirements"
            onAdd={() => addRequirement({ value: "" })}
            onRemove={removeRequirement}
            placeholder="e.g. 2+ years in a sales or customer-facing role"
            emptyLabel="No requirements added yet."
          />

          <ListFieldSection
            title="Preferred Skills"
            fields={skillFields}
            register={register}
            fieldName="preferredSkills"
            onAdd={() => addSkill({ value: "" })}
            onRemove={removeSkill}
            placeholder="e.g. Familiarity with CRM tools"
            emptyLabel="No preferred skills added yet."
          />

          <ListFieldSection
            title="Benefits"
            fields={benefitFields}
            register={register}
            fieldName="benefits"
            onAdd={() => addBenefit({ value: "" })}
            onRemove={removeBenefit}
            placeholder="e.g. Performance-based incentives"
            emptyLabel="No benefits added yet."
          />
        </div>

        {/* ── RIGHT COLUMN — SEO ── */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">SEO</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Meta Title
              </label>
              <input {...register("metaTitle")} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Meta Description
              </label>
              <textarea {...register("metaDesc")} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                OG Image URL
              </label>
              <input {...register("ogImage")} className={inputCls} placeholder="https://..." />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Job"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/careers")}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
