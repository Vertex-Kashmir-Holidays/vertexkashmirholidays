# 33 — Troubleshooting

> **What this section explains:** a compact symptom → likely cause → where to check → resolution matrix, for fast lookup during a live issue. §32's runbooks give the full step-by-step version of the higher-stakes rows below.
>
> **Confidence:** Synthesized from the confirmed mechanics across §07–§29.

---

| Problem | Likely Cause | Where to Check | Resolution |
|---|---|---|---|
| Online payment fails at checkout | Razorpay outage, expired `RAZORPAY_KEY_ID`/`SECRET`, or a client-side script blocker | Razorpay status page; Vercel function logs for `create-order`/`verify-payment`; `PaymentAudit` table | Staff can record the payment manually/offline instead (§14, §26); see §32 Third-Party API Failure |
| Booking stuck at `PENDING`, never reaches `PAID` | The `verify-payment` callback never fired (browser closed) and the webhook hasn't landed yet | `PaymentAudit`, Razorpay dashboard for the order/payment status | The webhook is the safety net (§26 Flow 2) — wait, or manually trigger `reconcile` (`POST /api/bookings/[id]/reconcile`, §09) |
| A booking's balance looks wrong | GST mistakenly assumed to be part of the payable formula, or a REFUND row's `type` wasn't selected by the caller | `computeBookingFinance` call site — is `type` selected alongside `amount`? | Re-read §26 Flow 3 — GST never enters payable/balance; REFUND subtracts from `paidAmount` |
| Admin module invisible to a non-SUPERADMIN role | `RolePermission` seed rows missing for that module | `prisma/seed.ts` `PERMISSION_DEFAULTS`, tested as SUPERADMIN (which bypasses and will falsely appear fine) | `yarn db:seed` after adding the module's rows (§10, §27) |
| A new API route works for SUPERADMIN but 403s for everyone else | Same as above — RBAC seed gap | Same | Same |
| Public page shows draft/unpublished content | A new query is missing `where: { published: true }` | The specific route/Server Component's Prisma query | Add the filter — the single most consequential CMS mistake (§08, §12) |
| Content edit not visible on the public site | Normal ISR behavior — up to 5 min cache | Time since edit; `REVALIDATE_SECRET` config | Wait, or `POST /api/admin/cache/flush` (§17) |
| A form silently "does nothing" on submit | Turnstile challenge failing invisibly, rate-limit 429, or a lead-dedup rejection | Browser network tab — actual response status/body | 429 → wait for `Retry-After`; dedup rejection is expected if a real active lead exists (§14, §21) |
| Analytics event never appears in GA4 | `NEXT_PUBLIC_GTM_ID` unset, route is `/admin`/`/account`/`/login` (suppressed by design), or the GTM container itself isn't configured for that tag | Browser console (`[Analytics]` log), GTM Preview mode | Confirm env var; remember GA4 config lives inside GTM, not this codebase (§13) |
| Offline conversion stuck at `PENDING`/`FAILED` | Adapter unconfigured (silently no-ops) or the upstream platform rejected it | `OfflineConversion.lastError`/`attempts` | Fix credentials, or `POST /api/offline-conversions/[id]/retry` (§13, §28) |
| Uploaded image 404s in production | Fell back to local-filesystem write because `CLOUDINARY_URL` was unset at upload time — doesn't survive Vercel's read-only, ephemeral filesystem | The image's actual URL — `res.cloudinary.com` vs. a local `/uploads/` path | Re-upload with Cloudinary properly configured (§15, §19) |
| Vertex Connect video call cuts off at 5 minutes | JaaS credentials (`JAAS_APP_ID`/`KEY_ID`/`PRIVATE_KEY`) unconfigured — falls back to public Jitsi's unauthenticated cap | `env` config | Configure JaaS credentials (§11, §28) |
| Old internal chat messages/attachments disappearing | Expected — the 90-day Connect retention cron | `connect-retention` cron logs, `RETENTION_DAYS = 90` in code | Not a bug — the only automated deletion policy in the system (§28, §31) |
| A staff member can't reach `/admin/mfa` or `/admin/profile` despite no permissions granted | Shouldn't happen — these are `UNGATED_PATHS`, always reachable | `src/app/admin/layout.tsx` | If actually blocked, that's a real bug in the layout gate itself (§10, §27) |
| Migration fails against production | A non-nullable column with no default added to a populated table | The migration SQL itself | Make it nullable/defaulted; never force through with a destructive change without explicit approval (§08) |
| A saved admin field silently doesn't persist | Field added to the Prisma model but missing from the route's `patchSchema` | The route's Zod schemas | Add the field to `patchSchema` too — `createSchema` and `patchSchema` are separate and must both be updated (§08, §09) |
| A new enum value renders unstyled/missing in the admin UI | Admin `*Client.tsx` components hardcode status badge color/transition maps per enum value | The relevant admin Client component's status-display map | Add the new value to that map — it's not automatically picked up from the schema (§08) |
| Preview/staging URL getting indexed by Google | Shouldn't happen — two independent layers prevent this | `src/proxy.ts` (`X-Robots-Tag`), `robots.ts` host check | Both should already block it; if not, that's a real bug in one of those two layers (§18, §21, §30) |
| Slow admin page | Missing `force-dynamic` causing stale cached data, or a query fetching more columns than the list needs | The page's `export const dynamic` directive; the Prisma `select` | Add `force-dynamic`; narrow the `select` (§08, §17, §27) |

## Related Documents

- §32 Operational Runbooks — full step-by-step procedure for the higher-stakes rows above
- §22 Observability — where to actually look, given the current logging/monitoring reality
- §35 Technical Debt — recurring root causes worth fixing at the source rather than repeatedly troubleshooting
