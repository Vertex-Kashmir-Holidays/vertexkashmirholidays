import { ProposalData } from "@/types/proposal";

// Stable ids for the seed document — new rows added in the editor get
// runtime ids instead, same convention as itinerary/default-data.ts.
export const DEFAULT_PROPOSAL_DATA: ProposalData = {
  docType: "multi",
  quoteNumber: "VKH-2026-0418",
  coverTitle: "Kashmir,",
  coverSubtitle: "three ways",
  coverIntro:
    "The same six days, the same valley, the same team on the ground. Choose how you would like to travel through it.",
  duration: "5 Nights · 6 Days",
  // Overridden per-proposal at creation time with the creating staff user's
  // own name/phone — see src/app/admin/proposals/new/page.tsx.
  preparedByName: "",
  preparedByPhone: "",
  preparedFor: "Mr Farooq Sheikh",
  travelDates: "10 - 15 Jun 2026",
  travelers: "2 Adults · 1 Child",

  tiers: {
    budget: {
      label: "Budget",
      title: "The Essentials",
      priceLabel: "Rs. 24,500",
      coverNote: "Comfortable hotels",
      description:
        "Clean, well-located hotels and a private car. Everything you need to see the valley, nothing you don't.",
      tags: ["Budget hotels", "Breakfast only", "Sedan", "Support 9am – 9pm"],
      badgeLabel: "",
    },
    premium: {
      label: "Premium",
      title: "The Valley, Properly",
      priceLabel: "Rs. 30,500",
      coverNote: "3-star · Shikara ride",
      description:
        "3-star hotels, dinner included every night, and a sunset Shikara ride on Dal Lake already paid for.",
      tags: [
        "3-star hotels",
        "Breakfast + dinner",
        "Sedan or Ertiga",
        "Shikara ride included",
        "Support 24×7",
      ],
      badgeLabel: "MOST CHOSEN",
    },
    luxury: {
      label: "Luxury",
      title: "Nothing Left to Arrange",
      priceLabel: "Rs. 52,000",
      coverNote: "5-star · Shikara & Gondola",
      description:
        "5-star properties and a night on a heritage houseboat. Shikara, Gondola and the Pahalgam valley taxis are all prepaid — you never open your wallet on the road.",
      tags: ["5-star hotels", "1 houseboat night", "Innova Crysta", "Shikara + Gondola", "Trip manager"],
      badgeLabel: "",
    },
  },

  tipText:
    "You can mix these. Take Premium hotels with the Luxury vehicle, or add the Gondola to Budget. Tell us what matters most and we will re-quote the same day.",

  comparisonRows: [
    { id: "cmp-1", label: "Hotels", budget: "Budget category", premium: "3-star", luxury: "5-star" },
    { id: "cmp-2", label: "Houseboat night", budget: "–", premium: "on request", luxury: "✓" },
    {
      id: "cmp-3",
      label: "Meals",
      budget: "Breakfast",
      premium: "Breakfast + dinner",
      luxury: "Breakfast + dinner",
    },
    { id: "cmp-4", label: "Vehicle", budget: "Sedan", premium: "Sedan or Ertiga", luxury: "Innova Crysta" },
    { id: "cmp-5", label: "Shikara ride", budget: "–", premium: "✓", luxury: "✓" },
    { id: "cmp-6", label: "Gulmarg Gondola", budget: "–", premium: "–", luxury: "Phase 1" },
    {
      id: "cmp-7",
      label: "Pahalgam valley taxis — Aru, Betaab, Chandanwari",
      budget: "–",
      premium: "–",
      luxury: "✓",
    },
    {
      id: "cmp-8",
      label: "Airport welcome",
      budget: "Driver pickup",
      premium: "Meet & greet",
      luxury: "Meet, greet & kahwa",
    },
    { id: "cmp-9", label: "Early check-in", budget: "–", premium: "if available", luxury: "guaranteed" },
    {
      id: "cmp-10",
      label: "Support",
      budget: "9am – 9pm",
      premium: "24×7 helpline",
      luxury: "Named trip manager",
    },
  ],
  comparisonFootnote:
    "Prices are for the full party of 2 adults and 1 child, sharing one room with an extra bed, and hold for 7 days from the date of this proposal. Hotel names are confirmed at booking; if a property is unavailable we substitute within the same category and tell you before the balance is due.",

  days: [
    {
      id: "pday-1",
      title: "Arrival & Srinagar Gardens",
      dateLabel: "Wed 10 Jun",
      body: "Airport pickup, then the Mughal Gardens – Shalimar, Nishat and Cheshmashahi – with Shankaracharya Temple and Hazratbal Dargah before sunset.",
      stayLabel: "Srinagar",
      highlightsLine: "Mughal Gardens · Hazratbal · Dal Lake",
      mealsLabel: "",
    },
    {
      id: "pday-2",
      title: "Gulmarg",
      dateLabel: "Thu 11 Jun",
      body: "A full day in the Meadow of Flowers, with the Gondola climbing to Kongdoori and horse trails out to Strawberry Valley. Back to Srinagar for the night.",
      stayLabel: "Srinagar",
      highlightsLine: "Gondola · Strawberry Valley",
      mealsLabel: "",
    },
    {
      id: "pday-3",
      title: "Sonamarg",
      dateLabel: "Fri 12 Jun",
      body: "Up the Sindh valley to the Meadow of Gold. Thajiwas Glacier sits a short pony ride from the road head, with the Himalayan wall behind it.",
      stayLabel: "Srinagar",
      highlightsLine: "Thajiwas Glacier · Sindh Valley",
      mealsLabel: "",
    },
    {
      id: "pday-4",
      title: "Pahalgam",
      dateLabel: "Sat 13 Jun",
      body: "Through Pampore's saffron fields and Awantipora to the Lidder valley. Aru and Betaab in the afternoon, then a night beside the river.",
      stayLabel: "Pahalgam",
      highlightsLine: "Aru · Betaab · Lidder",
      mealsLabel: "",
    },
    {
      id: "pday-5",
      title: "Back to Srinagar",
      dateLabel: "Sun 14 Jun",
      body: "Pari Mahal and Chashme Shahi above the lake, an afternoon in the old city bazaars, and a Shikara out onto Dal as the light goes.",
      stayLabel: "Srinagar",
      highlightsLine: "Pari Mahal · Shikara · Bazaars",
      mealsLabel: "",
    },
    {
      id: "pday-6",
      title: "Departure",
      dateLabel: "Mon 15 Jun",
      body: "Breakfast, then your driver takes you to Srinagar airport. Pickup time is confirmed with you the evening before.",
      // Left blank on purpose — the departure day shows a plane icon with
      // `highlightsLine` alone instead of the usual bed-icon + highlights
      // pair (see ProposalPdf.tsx's day-row rendering).
      stayLabel: "",
      highlightsLine: "Drop at Srinagar Airport",
      mealsLabel: "",
    },
  ],

  // Single-package-only fields — unused by this ("multi") document.
  stayPlan: [],
  stayPlanNote: "",
  transport: [],
  transportNote: "",

  inc: [
    { id: "pinc-1", category: "Stay", text: "5 nights with all hotel taxes paid" },
    { id: "pinc-2", category: "Transport", text: "Private vehicle for all 6 days" },
    { id: "pinc-3", category: "Transport", text: "Driver allowance, fuel, parking and tolls" },
    { id: "pinc-4", category: "Sightseeing", text: "Every stop shown in the six-day plan" },
    { id: "pinc-5", category: "Support", text: "Our own team on the ground, not an agency" },
  ],
  exc: [
    { id: "pexc-1", category: "Travel to Kashmir", text: "Flights or train fare to Srinagar" },
    {
      id: "pexc-2",
      category: "Activities",
      text: "Whatever your option does not already cover — see page 3",
    },
    {
      id: "pexc-3",
      category: "Local taxis",
      text: "Union vehicles in Pahalgam and Sonamarg, unless on Luxury",
    },
    { id: "pexc-4", category: "Personal", text: "Lunch, drinks, laundry, tips and shopping" },
    { id: "pexc-5", category: "Cover", text: "Travel insurance and medical expenses" },
  ],
  policyNote:
    "If snowfall, road closure or a security restriction forces a change, we rearrange the day at no extra charge. Any additional night or vehicle this creates is charged at cost, with your approval first.",

  payStep1Title: "To confirm your booking",
  payStep1Desc: "10% advance, payable by UPI, card or bank transfer",
  payStep2Title: "On arrival in Srinagar",
  payStep2Desc: "Remaining 90%, same payment options",
  pay: ["GST included", "No card fee", "No UPI fee"],
  payNote: "The quoted price is what you pay. Nothing is added later.",

  cancel: [
    { id: "pct-1", label: "30 days or more", charge: "10%" },
    { id: "pct-2", label: "15 to 29 days", charge: "25%" },
    { id: "pct-3", label: "7 to 14 days", charge: "50%" },
    { id: "pct-4", label: "Less than 7 days", charge: "75%" },
  ],
  cancelNotes: [
    "Refunds within 15 working days",
    "Returned to the account you paid from",
    "No refund for no-shows",
  ],

  // Same real copy as the main Itinerary module's default-data.ts (see
  // src/components/admin/itinerary/default-data.ts) — not per-proposal
  // marketing, so kept identical rather than reworded.
  whyChoose: [
    {
      id: "pwc-1",
      title: "Born in Kashmir",
      subtitle: "Our team is from Srinagar, Pahalgam & Gulmarg — not a Delhi call centre.",
      icon: "home",
    },
    {
      id: "pwc-2",
      title: "Transparent Pricing",
      subtitle: "What you see is what you pay. No hidden driver tip or gondola extra.",
      icon: "medal",
    },
    {
      id: "pwc-3",
      title: "Honest Itineraries",
      subtitle: "We tell you what's worth skipping. Real days. Real time.",
      icon: "star",
    },
    {
      id: "pwc-4",
      title: "Hassle-free Travel",
      subtitle: "24/7 on-ground support. Verified hotels. Sanitised cars.",
      icon: "support",
    },
  ],

  confirmStep1Title: "Reply with your option",
  confirmStep1Desc: "WhatsApp or email is fine. Mix and match if you want to.",
  confirmStep2Title: "We hold the hotels",
  confirmStep2Desc: "Named properties confirmed within 24 hours.",
  confirmStep3Title: "Pay 10% to lock it",
  confirmStep3Desc: "The balance is due only when you arrive.",
  closingHoldNote:
    "This proposal holds for seven days. After that we will re-check hotel rates, which move quickly in June — but the structure of these three options stays the same.",
};

// Seed content for the single-package document, transcribed from the supplied
// "Kashmir Winter Escape (5N6D)" sample quotation. Cover, Why Choose Us and
// Closing reuse the same real copy as DEFAULT_PROPOSAL_DATA (spread below)
// since those pages/sections are shared verbatim between both document
// types — only the body content unique to the single-package doc is written
// out fresh here.
export const DEFAULT_SINGLE_PROPOSAL_DATA: ProposalData = {
  ...DEFAULT_PROPOSAL_DATA,
  docType: "single",

  quoteNumber: "VKH/Q/2026",
  coverTitle: "Kashmir",
  coverSubtitle: "Winter Escape",
  coverIntro: "Srinagar, Pahalgam, Gulmarg and Sonamarg — one complete, ready-to-book package.",
  duration: "5 Nights · 6 Days",
  preparedFor: "Mr Farooq Sheikh",
  travelDates: "06 - 11 Jan 2027",
  travelers: "4 Adults",

  tiers: {
    ...DEFAULT_PROPOSAL_DATA.tiers,
    premium: {
      label: "Premium",
      title: "Kashmir Winter Escape",
      priceLabel: "Rs. 55,000/-",
      coverNote: "Premium hotels · Breakfast + dinner",
      description:
        "Premium category hotels with breakfast and dinner daily, a private Sedan, SUV, Innova or similar for the full trip, and a Shikara ride on Dal Lake already paid for.",
      tags: [
        "Premium category hotels",
        "Breakfast + dinner",
        "Private Sedan/SUV/Innova",
        "Child under 5 complimentary",
        "1-hour Shikara ride",
        "Airport/Railway/Bus Stop pick-up & drop",
      ],
      badgeLabel: "RECOMMENDED",
    },
  },
  tipText: "",
  comparisonRows: [],
  comparisonFootnote: "",

  days: [
    {
      id: "sday-1",
      title: "Arrival Srinagar – Pahalgam",
      dateLabel: "",
      body: "Arrive in Srinagar and proceed directly towards Pahalgam. Enjoy the scenic countryside and Lidder Valley en route. On arrival, check in and relax.",
      stayLabel: "Pahalgam",
      highlightsLine: "",
      mealsLabel: "Dinner",
    },
    {
      id: "sday-2",
      title: "Pahalgam Sightseeing",
      dateLabel: "",
      body: "Full-day exploration of Aru Valley, Betaab Valley and Chandanwari as per local conditions and vehicle regulations. Enjoy the beautiful meadows, mountains and Lidder River surroundings.",
      stayLabel: "Pahalgam",
      highlightsLine: "",
      mealsLabel: "Breakfast, Dinner",
    },
    {
      id: "sday-3",
      title: "Pahalgam – Srinagar Local Sightseeing",
      dateLabel: "",
      body: "After breakfast, check out and proceed to Srinagar. On arrival, visit Mughal Gardens, Shankaracharya Temple and enjoy a relaxing Shikara Ride on Dal Lake.",
      stayLabel: "Srinagar",
      highlightsLine: "",
      mealsLabel: "Breakfast, Dinner",
    },
    {
      id: "sday-4",
      title: "Srinagar – Gulmarg",
      dateLabel: "",
      body: "After breakfast, proceed to Gulmarg, known for its scenic meadows and Himalayan views. Explore Gulmarg Meadows, Gondola area and St. Mary's Church.",
      stayLabel: "Gulmarg",
      highlightsLine: "",
      mealsLabel: "Breakfast, Dinner",
    },
    {
      id: "sday-5",
      title: "Gulmarg – Sonmarg – Srinagar",
      dateLabel: "",
      body: "After breakfast, check out and proceed towards Sonmarg. Explore the Sonmarg Meadows, Sindh River and Thajiwas Glacier area before continuing to Srinagar for your final night.",
      stayLabel: "Srinagar",
      highlightsLine: "",
      mealsLabel: "Breakfast, Dinner",
    },
    {
      id: "sday-6",
      title: "Srinagar Departure",
      dateLabel: "",
      body: "After breakfast, check out and proceed towards the airport. Drop at Srinagar Airport/Railway Station as per departure schedule.",
      stayLabel: "",
      highlightsLine: "",
      mealsLabel: "Breakfast",
    },
  ],

  stayPlan: [
    {
      id: "sp-1",
      destination: "Pahalgam",
      nights: "02",
      hotelName: "Hidden Leaf Resort / The Royale / Mollys Resort / Similar",
      roomType: "Double Sharing",
    },
    {
      id: "sp-2",
      destination: "Gulmarg",
      nights: "01",
      hotelName: "Apple Tree Resort / Hotel Grand Hill View / Similar",
      roomType: "Double Sharing",
    },
    {
      id: "sp-3",
      destination: "Srinagar",
      nights: "02",
      hotelName: "Sideeq Palace / Welcome Residency",
      roomType: "Double Sharing",
    },
  ],
  stayPlanNote:
    "Exact hotel names are shared with the confirmed itinerary once the advance is received. All properties are personally inspected by our team and are subject to availability on the travel date.",

  transport: [
    {
      id: "tr-1",
      vehicle: "Sedan",
      seating: "04 + driver",
      usedFor: "Airport pick-up & drop, all sightseeing and inter-city transfers",
      duration: "06 Days",
    },
  ],
  transportNote:
    "The vehicle stays with your group for the whole trip — it is not shared with any other guests. Vehicle model may be replaced with a similar category on availability.",

  inc: [
    { id: "sinc-1", category: "", text: "Hotel stay for 5 nights as per plan" },
    { id: "sinc-2", category: "", text: "Daily breakfast and dinner" },
    { id: "sinc-3", category: "", text: "All transfers and sightseeing by private vehicle" },
    { id: "sinc-4", category: "", text: "Driver allowance, fuel, parking, tolls" },
    { id: "sinc-5", category: "", text: "All hotel taxes and GST, airport pick-up and drop" },
    { id: "sinc-6", category: "", text: "24x7 support from our local team" },
    { id: "sinc-7", category: "", text: "Honeymoon room decoration" },
    { id: "sinc-8", category: "", text: "1 hour Shikara ride" },
    { id: "sinc-9", category: "", text: "Honeymoon special cake" },
  ],
  exc: [
    { id: "sexc-1", category: "", text: "Pony rides and local union taxi charges" },
    { id: "sexc-2", category: "", text: "Entry fees at gardens and monuments" },
    { id: "sexc-3", category: "", text: "Lunch, travel insurance and personal expenses" },
    { id: "sexc-4", category: "", text: "Anything not listed under inclusions" },
  ],
  policyNote:
    "All costs are inclusive of GST. Rates are held only up to the validity date on the cover and can move with hotel availability during peak season.",

  payStep1Title: "To confirm your booking",
  payStep1Desc: "10% advance payment, payable by UPI, card or bank transfer",
  payStep2Title: "On arrival",
  payStep2Desc: "Remaining 90% balance, same payment options",
  pay: ["GST included", "No bank/UPI transfer fee", "No card fee"],
  payNote: "Payment policy may change during peak seasons.",

  cancel: [
    { id: "sct-1", label: "Before 1 month", charge: "10%" },
    { id: "sct-2", label: "15 to 29 days", charge: "25%" },
    { id: "sct-3", label: "7 to 14 days", charge: "50%" },
    { id: "sct-4", label: "Within 7 days", charge: "75%" },
  ],
  cancelNotes: [
    "Cancellations must be requested via email",
    "Minimum 5 working days' notice required",
    "No refund for no-shows or mid-tour cancellations",
    "Refunds processed within 15 working days",
  ],

  // Closing page copy — same 3-step "how to confirm" shape as
  // DEFAULT_PROPOSAL_DATA, worded for one package instead of three options.
  confirmStep1Desc: "WhatsApp or email is fine.",
  closingHoldNote:
    "This proposal holds for seven days. After that we will re-check hotel rates, which move quickly during peak season.",
};
