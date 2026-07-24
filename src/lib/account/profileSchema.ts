// Shared profile-form validation — used by both <ProfileForm /> and
// <AdminProfileForm /> (identical validation/submit contract against the same
// PATCH /api/account/profile route, see src/app/api/account/profile/route.ts).
// Keeping one schema means the two components can't drift from each other.
//
// confirmPassword is a client-only field (never sent to the server); the
// currentPassword-required-when-newPassword-set rule mirrors the server's own
// .refine in the route above, just surfaced as an inline error instead of
// after a round trip.

import { z } from "zod";

export const profileFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    image: z.string().max(2048).optional().or(z.literal("")),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.newPassword) return;
    if (data.newPassword.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be at least 6 characters",
        path: ["newPassword"],
      });
    }
    if (!data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required to set a new one",
        path: ["currentPassword"],
      });
    }
    if (data.confirmPassword !== data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
