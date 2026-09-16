# 40 — Documentation Maintenance

> **What this section explains:** how this documentation set stays accurate over time, and the concrete lesson this very documentation pass learned about what happens when it doesn't.
>
> **Confidence:** Direct — this section describes the process this documentation set itself should follow, informed by a real drift this pass discovered.

---

## The drift this pass actually found — a case study, not a hypothetical

`.ai/context/tech-stack.md` (last updated 2026-07-16) states, under "Future Roadmap," that Storybook, Playwright, Vitest, and visual regression testing are "confirmed absent — no Storybook config, no test runner config." At the time of this documentation pass (2026-09-15), all three are present in `package.json`, wired up, and functional (§04, §24). Similarly, `.ai/context/business-rules.md`'s CRM module list (last updated 2026-08-02) predates 8 admin modules now in production (§02, §27).

**Neither of these is a documentation failure in the sense of carelessness** — both `.ai/` documents were accurate when written and simply weren't updated as the codebase moved. This is the normal failure mode of hand-maintained documentation in an actively-developed repository, and it's exactly why this section exists: not to assign blame, but to make the update discipline explicit so it's easier to follow than to skip.

## Ownership and versioning

This documentation set (`docs/engineering/`) follows the same versioning discipline as `.ai/` (`.ai/README.md` → Versioning): each file should carry a "Last updated" indication (via its Confidence line or an explicit date), and a major architectural change should update the relevant file **before or alongside** the code change, not as an afterthought.

- **Maintainer**: Farooq Sheikh (per `.ai/README.md`'s Maintainers list) — the same owner as `.ai/`.
- **Source of truth precedence**: per `.ai/context/project-overview.md`'s own stated order — Business Rules → Engineering Instructions → Existing Production Behaviour → Human Decision. This documentation set adds one more principle specific to itself: **when this documentation and the live repository disagree, the repository wins**, and the disagreement should be fixed in the documentation, not treated as the repository being "wrong" (see the drift case study above).

## When to update this set

- **Every new admin module, API route domain, or third-party integration** should get a corresponding update to §09, §11, and/or §27 — these are the three sections most likely to silently under-count as the system grows (exactly the failure mode found above).
- **Every new ADR** in `.ai/adr/` should be reflected in §34's index.
- **Every schema migration** that adds a model/enum should be reflected in §08.
- **A change to `.ai/context/business-rules.md`** should prompt a check of §02, §14, §26 for consistency.
- **A change to `.ai/instructions/coding-standards.md` or `architecture.md`** should prompt a check of §03, §07, §21.

## How to check for drift (the practical process)

1. Compare `.ai/`'s "Last Updated" dates against recent `git log` activity in the areas each document covers — a large gap is a signal worth checking, not proof of drift on its own.
2. Where this documentation makes a specific, checkable claim (a route exists, a model has N fields, a dependency is at version X), re-verify it against the live repository rather than assuming it's still true — exactly the discipline this pass applied when it found the Storybook/testing-tooling gap.
3. Where a claim can't be verified from the repository alone (a Vercel/Neon dashboard setting, a third-party console configuration), it should stay marked **"Requires verification"** rather than be silently assumed — see §18, §22, §31 for examples of this pattern applied honestly.

## What NOT to do

- Don't let this documentation set become a second, competing source of truth alongside `.ai/` — where they cover the same ground, this set should cite and defer to `.ai/`'s current state, not fork its own independent narrative (§00 explains the intended relationship).
- Don't silently "fix" a stale `.ai/` claim by only updating this documentation set — the drift case study above should be corrected **at the source** (`.ai/context/tech-stack.md` and `.ai/context/business-rules.md`), with this documentation set's findings serving as the evidence for that correction.
- Don't invent a number, a metric, or a status to fill a gap — mark it **"Not confirmed in repository,"** **"Requires verification,"** or **"Not currently implemented"** instead, per the rule this entire documentation set was built under.

## Recommended follow-ups from this documentation pass

1. Update `.ai/context/tech-stack.md`'s Future Roadmap section to reflect the current testing-tooling reality (§04, §24, §35 P1).
2. Populate the empty `.ai/context/folder-structure.md` — §05 of this set can serve as a starting draft (§35 P1).
3. Update `.ai/context/business-rules.md` §8's CRM module list, or add a forward pointer to §27 of this set (§35 P1).
4. Consider linking this documentation set from the in-progress admin Docs module (`/admin/docs`, §27) — it's a natural fit for exactly the kind of internal reference material that feature exists to surface.

## Related Documents

- `.ai/README.md` → Versioning — the parallel discipline this section extends
- §00 Documentation Guide — the confidence-level system this maintenance process relies on
- §35 Technical Debt — every drift/gap this pass found, in full, prioritized
