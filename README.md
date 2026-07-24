# Vertex Kashmir Holidays

A production travel platform for Kashmir tourism — a public marketing/booking site, a customer account area, and an internal admin CRM, all in one Next.js app.

## What's in here

- **Public site** (`/`) — tour discovery, destination/activity pages, blog, lead capture, and the booking flow (Razorpay-backed).
- **Customer account** (`/account`) — booking history, payments, profile, reviews for logged-in customers.
- **Admin CRM** (`/admin`) — staff-only: leads, bookings, itineraries, content management (tours, destinations, blog, campaigns), users/roles, and Vertex Connect (an internal chat/meeting tool).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma + PostgreSQL (Neon) · Auth.js v5 · Tailwind CSS · Zod · Razorpay · Cloudinary · Yarn (Classic)

Full technology-by-technology detail — what each dependency is for, exactly where it's used, and the engineering rule for touching it — lives in [`.ai/context/tech-stack.md`](.ai/context/tech-stack.md).

## Prerequisites

- Node.js (this repo currently runs Node 24 locally — no `engines` field is pinned yet)
- Yarn Classic (`yarn -v` should show `1.x`)
- A PostgreSQL database — either a local Postgres instance or a free [Neon](https://neon.tech) database. There is no SQLite/MySQL fallback; the schema is PostgreSQL-only.

## Running locally

```bash
# 1. Clone and install
git clone <repo-url>
cd vertexkashmirholidays
yarn install

# 2. Configure environment variables
cp .env.example .env.local
```

Then edit `.env.local`:

- **Required** — the app will not start without these two:
  - `DATABASE_URL` — a real PostgreSQL connection string (see Prerequisites above).
  - `AUTH_SECRET` — generate one with `npx auth secret`.
- **Everything else in `.env.example` is optional for local dev.** Each integration (Cloudinary, Razorpay, Turnstile, Google/Meta Ads, SMTP, Upstash, JaaS) degrades gracefully when its variables are unset — the feature it powers is disabled locally rather than crashing the app. Add a section's variables only when you're actively working on that feature. See the comments above each variable in `.env.example` for what it's for and where to get a value.

```bash
# 3. Push the schema to your database
yarn db:push

# 4. Seed some local data (optional, but recommended — tours, an admin user, etc.)
yarn db:seed

# 5. Start the dev server
yarn dev
```

The app is now running at `http://localhost:3000`.

## Useful commands

```bash
yarn dev            # Start the dev server
yarn build           # Production build (prisma generate + next build)
yarn typecheck       # tsc --noEmit
yarn lint            # ESLint
yarn db:studio       # Prisma Studio — browse/edit your local database
yarn db:migrate      # Create a real migration file (see .ai/skills/prisma-migration.md before running this)
```

## Learn more about this codebase

This repository's engineering standards, architecture, and workflows are documented in `.ai/` — a single source of truth meant for every contributor (human or AI-assisted). **Start at [`.ai/START.md`](.ai/START.md)** before making any non-trivial change.

Contributing to this project (branch naming, commit conventions, PR process)? See [`CONTRIBUTING.md`](CONTRIBUTING.md).
