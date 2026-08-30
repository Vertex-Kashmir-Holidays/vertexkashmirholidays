// Central source of truth for Kashmir-bound flight/train facts (route
// connectivity, approximate duration, service notes). We have B2B flight/train
// access (Akbar, Riya, TripJack) but no live fare/schedule API, so this data
// is hand-maintained, not fetched — see TransportAssistanceBanner for the
// quote-request flow that supplements it with a real human check.
//
// SINGLE SOURCE OF TRUTH: city pages, the transport-assistance banner copy,
// and the origin-city FAQs all read from this file. Do not re-hardcode a
// flight/train fact anywhere else — update it here once instead.
//
// Content rule (see conversation/task history): keep `notes` conservative and
// qualitative (durations as ranges, "typically"/"around") — never invent a
// specific train name, number, frequency, airline, or fare. Rail figures below
// reflect that the Udhampur–Srinagar–Baramulla Rail Link (USBRL) became fully
// operational on 2025-06-06, with the Vande Bharat Express now running
// Jammu Tawi/Katra–Srinagar (~3h10m) — there is NOT yet a single through-train
// from any of these 5 cities directly to Srinagar; every rail journey still
// requires at least one change. Re-verify `lastVerified` periodically (routes,
// especially seasonal/direct flights, change without notice).

export type TransportMode = "AIR" | "RAIL";

// direct: non-stop the whole way (for RAIL, none of the 5 cities qualify today).
// seasonal-direct: direct service has run, but isn't guaranteed year-round.
// connecting: one change/layover, still a practical same-day option.
// multi-leg: long-distance train + a further change, effectively a multi-day option.
export type ConnectivityLevel = "direct" | "seasonal-direct" | "connecting" | "multi-leg";

export interface TransportRoute {
  originCitySlug: string;
  mode: TransportMode;
  destination: string;
  connectivity: ConnectivityLevel;
  /** Short, approximate range for badges/summaries — not a booking promise. */
  durationRange: string;
  /** Full sentence(s) rendered on-page — the single place this fact is authored. */
  notes: string;
  /** ISO date this route's facts were last checked against public sources. */
  lastVerified: string;
  active: boolean;
}

export const TRANSPORT_ROUTES: TransportRoute[] = [
  // ── Delhi ──────────────────────────────────────────────────────────────
  {
    originCitySlug: "delhi",
    mode: "AIR",
    destination: "Srinagar",
    connectivity: "direct",
    durationRange: "around 1h20m–1h40m",
    notes:
      "Delhi–Srinagar is one of India's most frequently flown domestic routes, with multiple direct flights daily and a flight time of around 1 hour 20 to 1 hour 40 minutes.",
    lastVerified: "2026-08-29",
    active: true,
  },
  {
    originCitySlug: "delhi",
    mode: "RAIL",
    destination: "Srinagar",
    connectivity: "connecting",
    durationRange: "around 12 hours with one change",
    notes:
      "Since June 2025 the Kashmir Valley has had its own rail link, with the Vande Bharat Express running between Jammu Tawi/Katra and Srinagar in around 3 hours 10 minutes. From Delhi, that means taking the New Delhi–Katra Vande Bharat Express (around 8 hours 20 minutes) and changing onto the Srinagar-bound service — there's no single through-train yet, but the journey no longer needs a road transfer either.",
    lastVerified: "2026-08-29",
    active: true,
  },

  // ── Mumbai ─────────────────────────────────────────────────────────────
  {
    originCitySlug: "mumbai",
    mode: "AIR",
    destination: "Srinagar",
    connectivity: "direct",
    durationRange: "around 2h45m–3h",
    notes:
      "Direct Mumbai–Srinagar flights operate on this route, typically taking around 2 hours 45 minutes to 3 hours; one-stop options via Delhi are also common. Airlines and schedules change by season, so we confirm live availability when you enquire.",
    lastVerified: "2026-08-29",
    active: true,
  },
  {
    originCitySlug: "mumbai",
    mode: "RAIL",
    destination: "Srinagar",
    connectivity: "multi-leg",
    durationRange: "roughly 28–33 hours, two legs",
    notes:
      "There's no direct train from Mumbai into the Kashmir Valley. The route involves a long-distance train to Jammu Tawi (roughly 24–30 hours), followed by the Jammu Tawi/Katra–Srinagar Vande Bharat Express (around 3 hours 10 minutes) — a multi-day option some travellers still choose over flying.",
    lastVerified: "2026-08-29",
    active: true,
  },

  // ── Bengaluru (aka Bangalore) ──────────────────────────────────────────
  {
    originCitySlug: "bangalore",
    mode: "AIR",
    destination: "Srinagar",
    connectivity: "connecting",
    durationRange: "roughly 5–6 hours, one stop",
    notes:
      "Most Kashmir-bound air travel from Bengaluru connects through Delhi or Mumbai, with a total journey of roughly 5 to 6 hours including the layover. Direct or near-direct seasonal flights have appeared on this route before, so it's worth checking current options when you enquire.",
    lastVerified: "2026-08-29",
    active: true,
  },
  {
    originCitySlug: "bangalore",
    mode: "RAIL",
    destination: "Srinagar",
    connectivity: "multi-leg",
    durationRange: "roughly 39–40 hours, two legs",
    notes:
      "By rail it's a long journey — typically 36-plus hours to Jammu Tawi, followed by the Jammu Tawi/Katra–Srinagar Vande Bharat Express (around 3 hours 10 minutes). Most Bengaluru travellers fly and treat the final Kashmir Valley rail leg as an optional scenic add-on.",
    lastVerified: "2026-08-29",
    active: true,
  },

  // ── Hyderabad ──────────────────────────────────────────────────────────
  {
    originCitySlug: "hyderabad",
    mode: "AIR",
    destination: "Srinagar",
    connectivity: "connecting",
    durationRange: "roughly 4–5 hours, one stop",
    notes:
      "Most Kashmir-bound flights from Hyderabad connect through Delhi, with a total journey typically around 4 to 5 hours including the layover. Low-frequency direct options have run seasonally, so it's worth confirming what's currently live for your dates.",
    lastVerified: "2026-08-29",
    active: true,
  },
  {
    originCitySlug: "hyderabad",
    mode: "RAIL",
    destination: "Srinagar",
    connectivity: "multi-leg",
    durationRange: "roughly 33–34 hours, two legs",
    notes:
      "By rail, Hyderabad to Jammu Tawi is roughly 30-plus hours, followed by the Jammu Tawi/Katra–Srinagar Vande Bharat Express (around 3 hours 10 minutes) — a long option most travellers reserve for experiencing the route rather than saving time.",
    lastVerified: "2026-08-29",
    active: true,
  },

  // ── Kolkata ────────────────────────────────────────────────────────────
  {
    originCitySlug: "kolkata",
    mode: "AIR",
    destination: "Srinagar",
    connectivity: "seasonal-direct",
    durationRange: "around 2.5h direct, or 4–4.5h via a stop",
    notes:
      "IndiGo has operated direct Kolkata–Srinagar flights; connecting options via Delhi are also available when direct seats aren't. Total journey time is typically around 2.5 hours direct, or 4 to 4.5 hours with a connection — we confirm what's currently live when you enquire.",
    lastVerified: "2026-08-29",
    active: true,
  },
  {
    originCitySlug: "kolkata",
    mode: "RAIL",
    destination: "Srinagar",
    connectivity: "multi-leg",
    durationRange: "roughly 33–34 hours, two legs",
    notes:
      "By rail, Kolkata to Jammu Tawi is roughly 30-plus hours, followed by the Jammu Tawi/Katra–Srinagar Vande Bharat Express (around 3 hours 10 minutes) — most Kolkata travellers fly and consider the train only for the scenic Kashmir Valley leg.",
    lastVerified: "2026-08-29",
    active: true,
  },
];

// Sitewide capability flags — flight/train assistance is a service we offer
// on every enquiry, not a per-tour attribute, so this is a single toggle
// rather than data on the Tour model. Read by the tour-listing sidebar block
// and available for any future UI that needs to gate on it.
export const TRANSPORT_FEATURES = {
  flightAssistance: true,
  trainAssistance: true,
} as const;

export function getCityTransportRoutes(citySlug: string): {
  air?: TransportRoute;
  rail?: TransportRoute;
} {
  return {
    air: TRANSPORT_ROUTES.find((r) => r.originCitySlug === citySlug && r.mode === "AIR" && r.active),
    rail: TRANSPORT_ROUTES.find(
      (r) => r.originCitySlug === citySlug && r.mode === "RAIL" && r.active,
    ),
  };
}

export interface TransportFaq {
  question: string;
  answer: string;
}

const FALLBACK_NOTE =
  "Routes and schedules change, so we check current flight and train options for this city when you request a quote.";

// Generates the two fact-driven FAQs from the route data (never hand-authored
// per city — that's exactly the duplication this file exists to prevent) plus
// two generic ones that only need the city name. Origin-city pages can still
// add their own editorial FAQs alongside these if genuinely useful.
export function buildTransportFaqs(
  cityName: string,
  routes: { air?: TransportRoute; rail?: TransportRoute },
): TransportFaq[] {
  const { air, rail } = routes;
  return [
    {
      question: `Is there a direct flight from ${cityName} to Srinagar?`,
      answer: air
        ? `${air.connectivity === "direct" ? "Yes — direct" : air.connectivity === "seasonal-direct" ? "Sometimes — direct" : "Usually one-stop:"} flights ${air.connectivity === "connecting" ? "connect via Delhi or Mumbai" : "operate on this route"}, taking ${air.durationRange}. ${FALLBACK_NOTE}`
        : FALLBACK_NOTE,
    },
    {
      question: `How long does it take to reach Kashmir from ${cityName} by train?`,
      answer: rail
        ? `${rail.notes} Overall, budget ${rail.durationRange}.`
        : FALLBACK_NOTE,
    },
    {
      question: `Can I book a Kashmir package from ${cityName} without flights included?`,
      answer: `Yes — every package price on this page covers your Kashmir stay and ground experience only. Flights or train tickets from ${cityName} are arranged separately once you request a quote.`,
    },
    {
      question: `Does Vertex Kashmir Holidays arrange train tickets from ${cityName} too?`,
      answer: `Yes. Our team puts together the best combination of flights or trains for your dates — including any connections — and shares the full plan with you before you decide.`,
    },
  ];
}
