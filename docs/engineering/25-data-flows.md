# 25 — Data Flows

> **What this section explains:** end-to-end data flow diagrams for the system's structural patterns — the general request flow, the ISR content-publish flow, and the analytics/attribution flow — as distinct from §26, which covers the specific business-process flows (lead→booking, payment) in full sequence-diagram detail.
>
> **Confidence:** Confirmed from the architecture, auth, caching, and analytics sections already documented; synthesized here as cross-cutting diagrams.

---

## General request → response data flow

```mermaid
flowchart LR
    Browser -->|1\. HTTP request| Edge["Edge Middleware<br/>src/proxy.ts"]
    Edge -->|2\. needsAuth?| Auth{"/admin, /account,<br/>/login, /api?"}
    Auth -->|No| Static["Static CSP, no auth()<br/>ISR-eligible"]
    Auth -->|Yes| Session["auth() — session resolved"]
    Static --> RSC["Server Component renders"]
    Session --> RSC2["Server Component / Route Handler"]
    RSC -->|"Direct Prisma read<br/>(published:true filter)"| DB1[(Postgres)]
    RSC2 -->|"requirePermission / userId scope"| DB2[(Postgres)]
    RSC -->|3\. HTML + JSON-LD| Browser2[Browser]
    RSC2 -->|3\. HTML or JSON| Browser2
    Browser2 -->|4\. Client mutation, if any| API["fetch() → Route Handler"]
    API -->|Zod validate, authorize| Domain["src/lib/&lt;domain&gt; function"]
    Domain -->|"$transaction if multi-step"| DB3[(Postgres)]
    DB3 -->|typed result| API
    API -->|JSON| Browser2
```

This is the same flow described narratively in §03; here it's shown as the concrete path data takes, annotated with where auth/caching decisions branch it.

## Content-publish data flow (admin edit → public visibility)

```mermaid
sequenceDiagram
    participant Staff
    participant AdminAPI as Admin API Route
    participant DB as PostgreSQL
    participant ISR as ISR Cache (Vercel)
    participant Visitor

    Staff->>AdminAPI: PATCH /api/tours/[id] (edit content)
    AdminAPI->>AdminAPI: requirePermission(packages, edit)
    AdminAPI->>DB: UPDATE Tour SET ...
    DB-->>AdminAPI: OK
    AdminAPI-->>Staff: 200

    Note over ISR: Public page still serving the OLD cached version
    alt No manual revalidation
        Visitor->>ISR: GET /tours/gulmarg-adventure
        ISR-->>Visitor: Stale content (up to 5 min old)
        Note over ISR: Background regeneration triggers after revalidate=300 window
    else Manual revalidation triggered
        Staff->>AdminAPI: POST /api/admin/cache/flush (REVALIDATE_SECRET)
        AdminAPI->>ISR: revalidatePath/Tag
        Visitor->>ISR: GET /tours/gulmarg-adventure
        ISR-->>Visitor: Fresh content immediately
    end
```

A content edit is not instantly public — up to a 5-minute ISR window applies unless the admin explicitly flushes the cache (§17).

## Marketing attribution data flow

```mermaid
flowchart TD
    A["Visitor clicks an ad<br/>(Google/Meta), lands with gclid/fbclid/UTM params"] --> B["AttributionCapture.tsx<br/>captures once, client-side"]
    B --> C{"What does the visitor do?"}
    C -->|Submits a Lead form| D["Lead row created<br/>carries full UTM/click-id block"]
    C -->|Books directly| E["Booking row created<br/>carries full UTM/click-id block"]
    C -->|Clicks WhatsApp instead| F["WhatsAppAttributionToken created<br/>attribution bridges the handoff"]
    F -->|"Visitor later submits a Lead<br/>(same session/token)"| D
    D -->|"Staff converts Lead → Booking"| G["Booking copies Lead's<br/>attribution verbatim — NOT re-captured"]
    E --> H["enqueueForBooking() on successful payment"]
    G --> I["enqueueForLead() at conversion"]
    H --> J["OfflineConversion queued"]
    I --> J
    J --> K["Google Data Manager API /<br/>Meta Conversions API"]
```

Attribution is captured **exactly once**, at the point of Lead or direct-Booking creation, and is never re-derived downstream — a deliberate, fixed capture point (§13).

## Notification data flow (internal)

```mermaid
flowchart LR
    A["Business event<br/>(new lead assigned, meeting invite, etc.)"] --> B["Notification row created<br/>(userId, type, title, body, link)"]
    B --> C["GET /api/notifications<br/>polled/fetched by the recipient's session"]
    C --> D["Admin UI notification bell"]
    B -.->|"Some events also"| E["sendMail() — best-effort,<br/>failure caught & logged, never blocks the primary action"]
```

## Related Documents

- §03 Architecture — the narrative version of the general request flow
- §17 Caching & Performance — the ISR mechanics behind the content-publish flow
- §13 Analytics & Tracking, §14 CRM & Lead Management — the attribution flow in full business context
- §26 Core Business Flows — the lead→booking→payment flow in full sequence-diagram detail (the complement to this section)
- §28 Background Jobs — where `enqueueForLead`/`enqueueForBooking` actually process
