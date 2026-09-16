# 16 — Search

> **What this section explains:** what search capability exists in VK today — deliberately short, because the honest answer is "very little."
>
> **Confidence:** Confirmed absent by direct repository inspection — grep across `src/`, `package.json` dependency check, and manual review of the public listing pages' query logic.

---

## No dedicated search feature exists

Confirmed directly:

- **No search-as-a-service dependency** — no Algolia, Elasticsearch, MeiliSearch, or any similar package anywhere in `package.json`.
- **No public `/search` route.**
- **No free-text query input on any public page.** The `/tours`, `/destinations`, and `/blog` listing pages were checked directly for `searchParams`-driven filter logic — none found. Filtering on these pages, where it exists, is by category grouping (e.g. tour category tabs), not a text search.
- The only "search" UI component in the entire codebase is `src/components/ui/molecules/admin-search-input.tsx` — a generic controlled text `<input>` with a search icon, used exclusively **inside the admin panel** to filter staff-facing lists (leads, bookings, users, etc.), not on any public-facing page.

## What this means in practice

A prospective traveller cannot type "houseboat Srinagar 5 days" into a search box anywhere on the public site. Discovery happens through browsing: category pages, destination pages, and internal links (tour → related destinations → related activities), plus organic/paid search landing directly on a specific tour or destination page from Google/ad campaigns. This is a real, current product characteristic — not a bug this documentation is flagging as broken, simply a capability that doesn't exist yet.

Internally, admin-side "search" is exclusively a client-side filter over an already-fetched (or server-paginated) list — it queries Prisma's `where: { contains: ... }` on a handful of fields per module, not a dedicated search index. This is adequate at the current data volume (hundreds, not millions, of leads/bookings/tours) but would not scale to a full-text, relevance-ranked search experience without a real search backend.

## If search becomes a requirement

Per §36 Scalability, a real search feature (public-site free-text search, or admin search at a much larger row count) would be the point at which introducing a dedicated search backend (Postgres full-text search as a first, low-effort step; Algolia/Meilisearch as a heavier one) becomes worth evaluating — not before, per `.ai/instructions/coding-standards.md`'s "avoid premature optimization/abstraction" principle.

## Related Documents

- §06 Frontend Architecture — how the public catalog listing pages currently filter/paginate without search
- §27 Admin / Dashboard Architecture — the admin search-input component's actual usage
- §36 Scalability & Future Architecture — when a real search backend would become warranted
