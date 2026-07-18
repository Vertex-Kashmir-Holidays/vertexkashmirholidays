# Project Overview

Version: 1.0.0

Last Updated: 2026-07-16

---

# Project

Vertex Kashmir Holidays is a production-grade travel platform focused on Kashmir tourism.

The platform consists of a public-facing website, an internal CRM, and supporting integrations for lead management, bookings, marketing, analytics, and operations.

The project is actively developed with long-term maintainability, scalability, and engineering quality as primary goals.

---

# Primary Objectives

- Generate qualified travel leads
- Convert leads into confirmed bookings
- Manage complete booking lifecycle
- Improve operational efficiency
- Deliver an excellent traveller experience
- Maintain a modern, scalable engineering codebase

---

# Major Systems

## Public Website

Purpose

- Tour discovery
- Lead generation
- SEO
- Content marketing
- Landing pages
- Package browsing
- Inquiry collection

---

## CRM

Purpose

- Lead Management
- Booking Management
- Customer Management
- Vendor Management
- Payments
- Itinerary Management
- Reporting

---

## Marketing

Integrations include

- Google Analytics 4
- Google Tag Manager
- Google Ads
- Meta Pixel
- Meta Ads
- Search Console

---

## Payments

Current

- Razorpay

Future

- Additional payment providers may be integrated.

---

# Booking Flow

The high-level booking lifecycle is:

```
Lead
↓

Qualified Lead

↓

Token Received

↓

Booking Created

↓

Services Added

↓

Booking Locked

↓

Invoice Generated

↓

Payment

↓

Travel

↓

Completed
```

Business rules for each step are defined in `business-rules.md`.

---

# Project Priorities

Engineering decisions should prioritize:

1. Reliability
2. Maintainability
3. Scalability
4. Performance
5. Developer Experience

---

# Architecture Principles

The project follows:

- Modular architecture
- Component composition
- Separation of concerns
- Server-first development where appropriate
- Strong typing
- Shared reusable UI
- Production-safe refactoring

Detailed architecture is documented in:

```
instructions/architecture.md
```

---

# Development Workflow

Every change should follow:

```
Plane Task

↓

Implementation

↓

Verification

↓

Review

↓

Commit

↓

Push

↓

Deployment
```

Commit messages follow:

```
type(VERTE-ID): description
```

Example

```
feat(VERTE-42): add booking timeline
```

---

# Documentation

Every important engineering decision should be documented.

Documentation is treated as part of the implementation—not an afterthought.

---

# Source of Truth

When conflicts arise, follow this order:

1. Business Rules
2. Engineering Instructions
3. Existing Production Behaviour
4. Human Decision
