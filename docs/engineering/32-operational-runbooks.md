# 32 — Operational Runbooks

> **What this section explains:** step-by-step playbooks for the incidents most likely to actually happen at VK, each following Symptoms → Diagnosis → Checks → Resolution → Verification → Escalation.
>
> **Confidence:** Synthesized from the confirmed mechanics documented in §07–§29 (each runbook cites the section it's built from). Where a runbook step depends on infrastructure this repository can't inspect (e.g. a Vercel dashboard action), that's stated explicitly.

---

## Production deployment

**Trigger**: merge to `main`.

- **Symptoms**: N/A — this is the normal-path runbook.
- **Steps**: CI (`typecheck`/`lint`/`build`) must pass on the PR before merge (§20). Merge `dev → main` as a regular (non-squash) merge. Vercel deploys automatically — `prisma generate && next build`, **not** `prisma migrate deploy`.
- **If the change includes a schema migration**: apply it to production **separately and deliberately**, before or independent of the code deploy — it is never automatic (§08, §20). Confirm with `npx prisma migrate status` before and after.
- **Verification**: confirm the Vercel deployment succeeded (dashboard), spot-check the changed feature on the live site, confirm no error spike in Vercel's function logs (§22).
- **Escalation**: if the build itself fails on Vercel despite passing CI, check for an environment-variable difference between CI's dummy values and production's real ones (§19).

## Rollback deployment

Full decision tree in §20 — summarized as a runbook:

1. **Diagnosis**: is this an application-code regression, or did a schema migration ship in the same deploy? (`npx prisma migrate status` against production settles this.)
2. **App-code-only**: Vercel dashboard → "Promote to Production" on the last known-good deployment (fast). In parallel, `git revert` the bad commit through a normal PR into `main`, then merge the same revert into `dev`.
3. **Schema-change-involved**: do **not** roll back application code first. Confirm whether the migration itself is the problem. If it needs undoing, write and apply a **new forward migration** — never hand-edit or delete an applied one. Only roll back code once the data/schema side is confirmed safe.
4. **Verification**: confirm the live site reflects the rollback; confirm `main`'s git history matches what's actually deployed (the revert commit exists).
5. **Escalation**: if unsure whether a migration is safe to leave in place while rolling back code — stop and get a second opinion before proceeding; this is explicitly the situation to slow down for (§20).

## Database migration (routine)

1. Edit `prisma/schema.prisma` — new columns on populated tables must be nullable or `@default(...)`.
2. `yarn db:migrate` (never leave as `db:push`-only against anything that needs to reach production).
3. Update the affected Zod schemas (`createSchema`/`patchSchema`), Prisma `select` projections, and `prisma/seed.ts`.
4. If a new admin-visible model: register it in `MODULES` (`src/lib/rbac.ts`) and seed `RolePermission` rows, then `yarn db:seed`.
5. Before applying to production: confirm the four Database Safety questions in §08 (needs production? real migration file exists? nullable/defaulted? `migrate status` checked?).
6. Commit the migration file — always.

Full detail and common mistakes: `.ai/skills/prisma-migration.md`, §08.

## Database recovery

**Requires verification** — no confirmed, tested restore procedure exists in this repository (§31). If this runbook is ever actually needed: (1) check Neon's dashboard for point-in-time recovery options, (2) if a logical backup exists, restore to a **new** database first and verify before pointing production at it, (3) never restore directly over the live production database without a verified-good snapshot in hand first. Treat this runbook as incomplete until §31's recommendations are addressed.

## Third-party API failure (Razorpay, Cloudinary, Google, Meta)

- **Symptoms**: an integration-specific feature stops working (payments failing, uploads failing, offline conversions not sending).
- **Diagnosis**: per ADR 0005, every integration no-ops gracefully when **unconfigured** — so a sudden failure is more likely a **live outage or expired credential** than a config issue, if it was working before. Check the relevant `OfflineConversion.lastError` (§28), `PaymentAudit` (§08, §22), or Vercel function logs for the actual error.
- **Checks**: is the provider's own status page reporting an incident? Has a credential rotated/expired (`RAZORPAY_SECRET`, `CLOUDINARY_URL`, etc. — §19)?
- **Resolution**: for Razorpay specifically, offline/manual payment recording by staff remains available even if the online gateway is down (§14) — this is a real business continuity path, not just a technical fallback. For Cloudinary, confirm the credential is still valid in the Cloudinary console.
- **Verification**: retry the failed operation; for offline conversions, use the manual sweep endpoints (`POST /api/offline-conversions/retry`, §09) once the underlying issue is fixed.
- **Escalation**: a Razorpay outage affecting live payments is a revenue-critical incident — escalate immediately, don't wait for the provider's own status page to update.

## CMS / content not updating

- **Symptoms**: an admin content edit isn't visible on the public site.
- **Diagnosis**: this is very likely the **normal ISR behavior**, not a bug — public content pages cache for up to 5 minutes (`revalidate = 300`, §17).
- **Checks**: has it been more than 5 minutes? Was the edit actually saved (check the admin list page reflects it)?
- **Resolution**: wait for the ISR window, or trigger `POST /api/admin/cache/flush` (`REVALIDATE_SECRET`, §17, §19) for an immediate refresh.
- **Escalation**: if content still doesn't update after a manual flush, check whether the query powering that page is missing the new field (a schema-change follow-through gap, §08) or whether `published` is actually `true` on the record.

## Analytics not recording

- **Symptoms**: GA4/GTM events aren't appearing.
- **Diagnosis**: confirm `NEXT_PUBLIC_GTM_ID` is set (§19). Confirm the route isn't `/admin`/`/account`/`/login` — GTM is deliberately suppressed there (`isInternalRoute`, §13).
- **Checks**: open the browser console in dev mode — every `push()` call logs `[Analytics] {...}`. Use GTM's own Preview mode against the live site.
- **Resolution**: if the `dataLayer` push is firing but GA4 shows nothing, the issue is in the **GTM container configuration itself** (outside this repository) — not application code, since GA4 is configured as a GTM tag, not called directly.
- **Escalation**: a missing conversion event with real ad spend riding on it (Google Ads/Meta attribution) should be escalated to whoever manages the ad accounts, not treated as a pure engineering bug.

## Forms not submitting (leads / contact / careers)

- **Symptoms**: a public form fails to submit.
- **Diagnosis**: check for a Turnstile failure (is `TURNSTILE_SECRET_KEY` set and the widget rendering?), a rate-limit rejection (429, §21), or a dedup block (a lead form specifically — same phone/email, active status, <15 days, §14).
- **Checks**: inspect the network response — a `429` means rate-limited (check `Retry-After`); a `422`/validation error means a Zod check failed; a specific dedup message means the 15-day active-lead rule triggered (§14) — this is expected behavior, not a bug, if the visitor genuinely already has an active enquiry.
- **Resolution**: for a genuine bug, reproduce with the exact same inputs and check server logs (§22) for the actual exception.
- **Escalation**: a sitewide form failure (not just one submission) is high-priority — it silently stops lead generation, the business's primary acquisition channel (§02).

## WhatsApp conversion not firing

- **Symptoms**: WhatsApp clicks aren't showing as `whatsapp_click` events.
- **Diagnosis**: remember WhatsApp integration is **click-to-chat links only** (§14) — there's no server-side WhatsApp API to fail. The only thing that can break is the client-side `trackWhatsappClick()` call itself.
- **Checks**: confirm the link still opens `wa.me` correctly (a broken `whatsapp` field in `SiteSettings` would break the link itself, not just tracking). Check the browser console for the analytics log.
- **Resolution**: this is a frontend/analytics bug, not an integration outage — fix per §13's client-side pipeline.

## CRM lead not created

- **Symptoms**: a form submission succeeds client-side but no `Lead` row appears.
- **Diagnosis**: check whether the dedup rule (§14) silently rejected it as a near-duplicate — this can look like "the form disappeared but nothing happened" if the client-side handling of that specific rejection isn't obvious.
- **Checks**: `POST /api/leads`'s actual response — a 4xx there with a dedup message is expected behavior, not data loss.
- **Escalation**: if leads are being silently lost with no error surfaced to the visitor, that's a real bug in the form's error handling — high priority given leads are the business's core acquisition mechanism.

## Website down

- **Symptoms**: the site is unreachable or 5xx-ing broadly.
- **Diagnosis**: check Vercel's status page and the project's deployment status first — is the most recent deploy actually healthy?
- **Checks**: DNS (Bluehost) resolving correctly? Neon database reachable (a DB outage would 5xx every page that queries it, which given the layout/SiteSettings fetch is effectively every public page — §06)?
- **Resolution**: if the last deploy is bad, roll back per the Rollback runbook above. If it's a Neon or Vercel platform outage, there is no application-level mitigation — this is a genuine dependency on both platforms' own uptime (§18, §31).
- **Escalation**: sitewide downtime is the highest-priority incident category — escalate immediately.

## Slow website

- **Symptoms**: pages loading noticeably slowly.
- **Diagnosis**: is it public (ISR-cached) pages or admin (`force-dynamic`) pages? Public-page slowness pointing at a cache miss/regeneration is different from admin-page slowness pointing at a slow query.
- **Checks**: run `yarn lhci` locally against the affected URL pattern (§30) — but remember there's no historical baseline enforced in CI to compare against, so this is a fresh measurement, not a regression diff. Check Neon's dashboard for slow-query or connection-saturation signals (§22, requires verification since not inspectable here).
- **Escalation**: if this correlates with a specific recent deploy, treat it as a candidate for the Rollback runbook.

## Broken images

- **Symptoms**: images 404 or fail to load.
- **Diagnosis**: is `CLOUDINARY_URL` still valid (§15, §19)? Was the image ever actually uploaded to Cloudinary, or did it fall back to a local-filesystem write that doesn't exist in the deployed environment (§15's explicit warning about this)?
- **Checks**: inspect the actual image URL — does it point at `res.cloudinary.com` (correct) or a local `/uploads/` path (broken in any deployed environment)?
- **Resolution**: if local-filesystem fallback paths leaked into production data, the fix is re-uploading through the proper Cloudinary path with `CLOUDINARY_URL` correctly configured.

## Authentication failure

- **Symptoms**: users can't sign in.
- **Diagnosis**: which path — Credentials, Google OAuth, or Google One Tap (§10)? A Credentials failure could be a rate-limit lockout (§21) or a genuine bad password (both collapse to the same generic error by design, so this is hard to distinguish from outside). A Google-path failure could be a domain-restriction rejection (`isAllowedGoogleDomain`) — expected behavior for a non-customer domain, not a bug.
- **Checks**: confirm `AUTH_SECRET` hasn't changed unexpectedly (a changed secret invalidates all existing sessions — §19). Confirm `GOOGLE_CLIENT_ID`/`SECRET` are current if the Google paths are affected.
- **Escalation**: an authentication outage affecting **staff** specifically blocks all CRM/booking-management operations — treat as high-priority even though it's not customer-facing downtime.

## Related Documents

- §20 CI/CD & Deployment, §08 Database Architecture — the mechanics each runbook above is built from
- §33 Troubleshooting — the compact symptom → cause → fix matrix version of this section
- §22 Observability — where to actually look during any of the above
- §31 Disaster Recovery — the database-recovery gap this section's runbook explicitly flags as incomplete
