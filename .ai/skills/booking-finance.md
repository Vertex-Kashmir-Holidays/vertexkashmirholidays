This Skill defines how booking finance calculations are implemented in the Vertex Kashmir Holidays repository.

This is a repository-specific engineering skill, not a finance tutorial.

Reference existing engineering documents instead of duplicating them.

────────────────────────────────────

# Booking Finance

Version: 1.0.0

Last Updated: 2026-07-17

## Purpose

This Skill defines the single source of truth for every booking-related financial calculation in Vertex — booking amount, discount, GST, payable, paid, and balance — so the API and the UI can never compute two different numbers for the same booking.

────────────────────────────────────

## When to Use

Use this Skill whenever implementing or modifying:

- Booking amount, discount, or effective payable.
- GST on a payment.
- Partial/token/final payments and balance.
- The online advance-vs-full payment choice.
- Invoice values.
- A refund entry.

────────────────────────────────────

## When NOT to Use

Do not use this Skill for:

- Tour list-price content (`Tour.priceFrom`/`priceWas`) — that's catalog pricing, not booking finance.
- Razorpay SDK/webhook integration mechanics (`api-route.md` covers the route shape; this Skill covers only the numbers).
- Marketing/coupon systems — none exist in this repository today.

────────────────────────────────────

## Before You Start

Confirm:

- The calculation genuinely doesn't already exist in `src/lib/bookings/finance.ts` or `src/lib/payments/gst.ts`.
- You are not about to compute a total, discount, or GST value a second time in a component or a different route — there is exactly one place each of these is computed, and every caller imports it.
- `../context/business-rules.md` → Payment Rules / Pricing Rules for the business rule itself, before touching the code.

Never introduce a second calculation path for something these two files already own.

────────────────────────────────────

## Prerequisites

Review:

- `src/lib/bookings/finance.ts` — `computeBookingFinance`, `computeDiscountAmount`, `computeChargeable`, `computePaymentStatus`.
- `src/lib/payments/gst.ts` — `resolveGst`, `parseGstRates`, `isCashMethod`.
- The `Booking`, `BookingPayment` models in `prisma/schema.prisma`.
- `../context/business-rules.md` → Payment Rules and Pricing Rules.

If a schema change is required, also follow `prisma-migration.md`.

────────────────────────────────────

## Vertex Standard Workflow

The actual computation, in order (`computeBookingFinance`):

1. `bookingAmount` = `round2(max(0, booking.amount))`.
2. `discountAmount` = `computeDiscountAmount(bookingAmount, discountType, discountValue)` — `FLAT` (a fixed rupee value) or `PERCENT` of `bookingAmount`, clamped between `0` and `bookingAmount`.
3. `effectivePayable` = `round2(bookingAmount − discountAmount)`.
4. `paidAmount` = `round2(sum of all BookingPayment.amount rows)`.
5. `servicesTotal` = `round2(sum of all BookingService.amount rows)` — tracked separately; not netted against the payable.
6. `balance` = `round2(effectivePayable − paidAmount)`.
7. `paymentStatus` = `computePaymentStatus(effectivePayable, paidAmount)` — `PENDING`/`PARTIAL`/`FULL`, always derived, never stored as a column.

GST is a **separate, payment-level** calculation (`resolveGst`), not part of the sequence above:

- Applies only to a non-cash `method` (anything other than `"Cash"`, case-insensitive).
- Optional — a percent is chosen from `parseGstRates()` (configurable via `SiteSettings`, default `[5, 16, 18]`).
- `gstAmount = round2(paymentAmount × gstPercent / 100)`, persisted on that `BookingPayment` row for reporting.
- **Does not change `effectivePayable` or `balance`** — it's recorded as a tax breakdown of the amount received, not added on top of it. Do not fold GST into the payable/balance formula above.

────────────────────────────────────

## Engineering Rules

- Never trust a client-sent amount anywhere in this flow — `computeChargeable(total, option)` (the online `ADVANCE` 10% / `FULL` choice) and every GST/discount value are always recomputed server-side from the booking record, even if the client sends one.
- Reuse `computeBookingFinance`/`resolveGst`/`computeChargeable` — never re-derive a total, discount, or GST value inline in a route or a component.
- Round with `round2` (`Math.round((n + Number.EPSILON) * 100) / 100`) — don't introduce a second rounding approach for a new calculation in this domain.
- `PaymentStatus` is always derived from `effectivePayable`/`paidAmount` at read time — never add a stored "payment status" column that could drift from the real numbers.
- A payment amount can never exceed the remaining `balance`, **except** a `REFUND`-type payment, which is explicitly excluded from that check (see Common Mistakes for the current gap in how a refund nets into `paidAmount`).

────────────────────────────────────

## Financial Components

As actually implemented — no additional concepts exist beyond these:

- **Booking Amount** — `Booking.amount`, the negotiated total (lead conversion) or package price (direct booking).
- **Discount** — `Booking.discountType` (`FLAT`/`PERCENT`) + `Booking.discountValue`, booking-level.
- **GST** — `BookingPayment.gstPercent`/`gstAmount`, payment-level, non-cash only, optional.
- **Effective Payable** — `bookingAmount − discountAmount`.
- **Paid Amount** — sum of all payment rows (see Common Mistakes re: refunds).
- **Balance** — `effectivePayable − paidAmount`.
- **Payment Status** — derived `PENDING`/`PARTIAL`/`FULL`.
- **Services Total** — sum of `BookingService` line items; cost/margin tracking, not a customer-facing charge by default.

────────────────────────────────────

## Financial Ownership

The following utilities own these calculations.

computeBookingFinance()

- Booking Amount
- Discount
- Effective Payable
- Paid Amount
- Balance
- Payment Status

resolveGst()

- GST Percentage
- GST Amount
- Cash vs Non-Cash

computeChargeable()

- Online Advance
- Full Payment

────────────────────────────────────

## Payment Flow

Two distinct lifecycles exist — don't conflate them:

**Direct website booking (online, Razorpay):**

```
create-order (server computes chargeable amount)
  ↓
Razorpay checkout
  ↓
verify-payment (HMAC signature check, marks booking PAID)
  ↓
webhook (async confirmation)
```

**Lead-converted booking (staff-recorded):**

```
Lead conversion → booking created with a TOKEN payment (amount + optional GST if non-cash)
  ↓
Staff records further PARTIAL/FINAL payments via the admin booking-payments route
  ↓
Balance reaches 0 → paymentStatus = FULL
```

Invoice generation (`src/lib/bookings/invoice-pdf.tsx`, `src/lib/pdf/InvoiceDocuments.tsx`) is intended to read from the same `computeBookingFinance` output as the API and the admin UI — per this module's own stated design goal of "one source of truth" — rather than recompute totals independently.

────────────────────────────────────

## Common Mistakes

- **Recomputing a total, discount, or GST value inline** instead of importing the shared function — the exact drift these utilities exist to prevent.
- **Trusting a client-sent amount** for the online advance/full choice or a manually-recorded payment.
- **Treating GST as part of the payable/balance formula** — it isn't; it's payment-level reporting metadata only.
- **A likely real defect, not a deliberate rule — verify before relying on it:** `computeBookingFinance`'s `paidAmount` sums _all_ payment rows, including `REFUND`-type ones, without sign-flipping. A recorded refund currently **increases** reported `paidAmount` instead of reducing it. Don't copy this behavior into a new calculation as if it were intentional — confirm the actual intended refund accounting before extending this code path.
- **Adding a new "final amount" field** that duplicates `effectivePayable` — there is already exactly one name for this concept.
- **Skipping the `financial calculations` engineering rule from `../instructions/coding-standards.md` → Database Standards** by computing a total directly inside a component instead of calling the shared utility.

Never change a financial calculation without reviewing:

- Invoice generation
- Booking APIs
- Payment APIs
- Admin Booking UI
- Customer Portal

────────────────────────────────────

## Verification

```bash
yarn typecheck
yarn lint
yarn build
```

Then manually verify: a booking with a `FLAT` discount and one with a `PERCENT` discount compute the same `effectivePayable` in both the admin UI and a fresh API call; a non-cash payment with GST selected persists the correct `gstAmount`; a cash payment never carries GST; the balance reaches exactly `0` after full payment, not a rounding-drifted near-zero value.

────────────────────────────────────

## Delivery Summary

Every finance-related task should report:

- Business purpose and which financial rule was affected.
- Utilities modified (`finance.ts`, `gst.ts`, or both).
- API routes affected.
- Database changes, if any.
- Verification performed.
- Manual deployment steps, if any.
- Suggested branch name and commit message.

If no manual action is required, explicitly state:

"No manual action required."

────────────────────────────────────

## Real Repository Examples

- `src/app/api/bookings/[id]/payments/route.ts` — calls `computeBookingFinance` to reject a payment that would exceed the remaining balance, and `resolveGst` to compute/persist GST on that payment.
- `src/app/api/leads/[id]/convert/route.ts` — calls `resolveGst` on the token payment recorded at conversion, inside the same `$transaction` that creates the booking.
- `src/lib/bookings/finance.ts` — `computeChargeable` is the single place the 10% online advance is computed, shared by `create-order` and `verify-payment` so the order amount and the recorded payment can never drift.
- The refund/`paidAmount` interaction above — the clearest example in this codebase of why "one source of truth" doesn't automatically mean "verified correct for every edge case."

────────────────────────────────────

## Related Documents

- `prisma-migration.md`
- `api-route.md`
- `admin-crud.md`
- `../context/business-rules.md`
- `../instructions/coding-standards.md`
- `../instructions/architecture.md`
- `../instructions/git-workflow.md`
- `../workflows/feature.md`
