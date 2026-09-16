# 31 — Disaster Recovery & Backup

> **What this section explains:** what backup and recovery capability actually exists today, and what does not — stated plainly, with a recommendation where a real gap exists, kept separate from current-state fact.
>
> **Confidence:** Mostly **requires verification** — database backup configuration lives in the Neon dashboard, which this repository cannot inspect. What this section can confirm from the repository is the *absence* of anything backup/DR-related in application code, and the migration-rollback procedure that does exist.

---

## Database backups

**Requires verification.** Neon (the managed Postgres provider) offers point-in-time recovery and automated backups as a platform feature, but **whether it is enabled, and what retention window is configured, cannot be confirmed from this repository** — that's a Neon-dashboard-level setting. This is precisely the kind of infrastructure fact that a no-IaC setup (§18) makes invisible to source control. **Recommendation** (explicitly marked as a recommendation, not documented current state): confirm Neon's backup/PITR settings for the production database and record the retention window and recovery procedure in this document once verified.

## What VK's own code does NOT provide

- **No application-level backup mechanism** — no scheduled export job, no `pg_dump` cron, nothing in `src/` that snapshots data independent of whatever Neon itself provides.
- **No documented data-recovery runbook** beyond the schema-migration rollback procedure below.
- **No cross-region or multi-provider redundancy** — VK is fully dependent on Vercel's and Neon's own availability; there is no documented failover to a secondary host/database.

## Schema migration safety — the one real, confirmed DR-adjacent procedure

Per §08/§20, this is what genuinely exists and is followed:

- **Two separate Neon databases** (dev/prod) — a destructive experiment in development structurally cannot reach production data.
- **Forward-only migrations** — Prisma Migrate has no down-migration mechanism. Reversing a schema change means writing and applying a **new forward migration**, never hand-editing or deleting an applied migration file.
- **Before any production migration**: (1) confirm it needs to reach production; (2) confirm a real migration file exists (`yarn db:migrate`), not just a local `db:push`; (3) confirm new columns are nullable/defaulted so they won't fail against existing rows; (4) run `npx prisma migrate status` to confirm production isn't already out of sync.
- **Never** run `prisma migrate reset` or any destructive operation against production.

## Application-code rollback (a distinct concept from database recovery)

Fully covered in §20 — summarized here for DR completeness:

- **App-code-only regression**: Vercel dashboard "Promote to Production" (fast) + a real `git revert` merged through `dev`/`main` (so history matches reality).
- **A shipped-with-schema-change regression**: application rollback and schema rollback are **not the same operation** and must be sequenced carefully — Vercel's rollback never undoes an already-applied migration. See §20/§32 for the full procedure.

## Data-retention / deletion policy — narrower than "disaster recovery," but adjacent

The **only** confirmed automated data-deletion policy anywhere in the system is Vertex Connect's 90-day chat-message/attachment purge (§28). Every other model (bookings, leads, payments, users) has **no automated retention/deletion policy** — soft-delete (`deletedAt`) is the default for business records, with hard delete as a separate, explicit, rare action (§08). This means, in DR terms: there is no "accidentally deleted 90 days ago and it's gone" risk for the core business data models the way there deliberately is for internal chat history.

## What a real incident response looks like today, honestly

Given the absence of a documented DR runbook beyond the migration procedure above, and the absence of any APM/alerting (§22): the practical "disaster recovery" reality at VK today is (1) Vercel's own deployment history for a code-level rollback, (2) whatever Neon's dashboard provides for a database-level restore (unconfirmed), and (3) manual, careful reasoning through the exact procedure in §08/§20/§32 for anything schema-related. This is a reasonable posture for the current team size and traffic level, and a real, nameable risk if either grows without this gap being addressed first (§36).

## Recommendations (explicitly labeled — not current state)

- Verify and document Neon's backup/PITR configuration and retention window for the production database.
- Consider a periodic, automated logical backup (`pg_dump` to cold storage) as a second line of defense independent of the hosting provider's own mechanism, given the "no dedicated secrets manager, no IaC" posture already noted in §18/§21 — a provider-independent backup is cheap insurance against a Neon-account-level incident, not just a data-corruption one.
- Document a tested restore procedure, not just a backup's existence — an untested backup is not a confirmed recovery capability.

## Related Documents

- §08 Database Architecture — Database Safety, the two-database split, forward-only migrations
- §18 Infrastructure & Hosting — the no-IaC characteristic that makes dashboard-level DR settings invisible here
- §20 CI/CD & Deployment — the full application-code rollback procedure
- §28 Background Jobs — the Vertex Connect 90-day retention purge, the one real automated deletion policy
- §32 Operational Runbooks — the step-by-step procedure for a production migration incident
- §36 Scalability — why this gap becomes more consequential as the business grows
