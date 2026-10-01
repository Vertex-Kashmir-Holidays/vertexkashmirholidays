// Christmas offer content load. DRY RUN unless APPLY=1. Touches only OccasionOffer(christmas-kashmir-tour-package-2026) + its 4 packages.
// Never touches: published, prices, activities/priceNotes, compareRows/Values, hotels, images, itinerary destinations, Tour/CRM mirror, other offers.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { offerPatchSchema, offerPackageInputSchema } from "@/lib/offers/content";

const SLUG = "christmas-kashmir-tour-package-2026";
const DIR = "/Users/farsheik/Desktop/vertexkashmirholidays/scripts/offer-backups/christmas-2026";
const prisma = new PrismaClient();

const offerContent = {
  metaTitle: "Christmas Kashmir Tour 2026",
  metaDesc: "Christmas in Kashmir — 22 to 27 December. Christmas Eve in Srinagar, Christmas Day in the Gulmarg snow, houseboat night on Dal Lake. One price for 2 adults.",
  shortDescription: "Five nights from 22 to 27 December. Christmas Eve in Srinagar, where the old churches still hold a service, and Christmas morning in the snow at Gulmarg. One clear price for two adults — the chained vehicle up the winter road is included, which most quotes leave out.",
  heroTitle: "Christmas Eve in Srinagar, Christmas Day in the Snow",
  heroSubtitle: "22 – 27 December 2026 · 5 nights · Srinagar, Pahalgam, Gulmarg, Sonamarg",
  ctaLabel: "Get My Christmas Package",
  overview: `<p>Christmas Eve in Srinagar is quieter than people expect. The valley has had a small Christian community for over a century, and the old churches on Maulana Azad Road and at Sonwar still hold a service on the night of the 24th. If you would like to attend one, tell us and we will arrange the transport.</p>

<p>Then on Christmas morning you drive west to Gulmarg, where the snow is. Not a day trip — you stay the night at 8,700 feet, ride the Gondola over the Pir Panjal, and spend Christmas afternoon on the slopes.</p>

<p>Five nights in all, from 22 to 27 December: Srinagar and Dal Lake, two days in the Lidder valley at Pahalgam, Christmas in Gulmarg, a day towards Sonamarg, and a final night on a houseboat before you fly home on the 27th.</p>

<p>Winter here has real logistics behind it. Above Tangmarg, only chained vehicles are allowed once snow settles — an extra cost most operators collect at the roadside. It is inside this price, along with the Gondola, the airport transfers and all hotel taxes. Our office is at Reram, Tangmarg, on that road.</p>`,
  whyThisOffer: [
    { title: "Christmas Day in Gulmarg, not a day trip", text: "Every package puts you in Gulmarg on the night of 25 December. Most Kashmir Christmas packages keep you in a Srinagar hotel and drive you up for a few hours — you lose the morning to the road and you are gone before dark." },
    { title: "Christmas Eve where it is actually marked", text: "Srinagar's Christian community is small but long-standing, and the old churches hold a service on the night of the 24th. We can arrange transport if you would like to attend. Nobody else builds a Kashmir Christmas trip around this." },
    { title: "Late December is when the snow arrives", text: "Gulmarg is usually well under snow by Christmas week, and the Gondola is running. Nobody can promise snowfall on a given date, but if you want to see Kashmir white without the New Year crowds and rates, this is the week." },
    { title: "The chained vehicle is included", text: "Once snow settles, vehicles need chains to climb from Tangmarg to Gulmarg. Most quotes leave this out and collect it at the roadside when you have no choice. It is inside this price, both ways." },
    { title: "One clear price for two adults", text: "Every price on this page is the total for 2 adults, with breakfast and dinner daily and a private vehicle. What is included is listed plainly below, and what is not is listed just as plainly." },
    { title: "A team that lives on this road", text: "We are based at Reram, Tangmarg, at the foot of the Gulmarg road. Our team is on call through your trip and changes plans for weather and road conditions, because we are twenty minutes away, not in another city." },
  ],
  days: [
    { title: "Arrive in Srinagar — Dal Lake & Mughal Gardens",
      description: "Your driver meets you at Srinagar airport and takes you to your hotel. In the afternoon, visit the Nishat and Shalimar Mughal Gardens — bare and still in winter, with the Zabarwan hills white behind them — and finish with a Shikara ride on Dal Lake as the light goes. December evenings in Srinagar are cold; dinner is at your hotel.",
      highlights: ["Srinagar airport pickup", "Nishat & Shalimar Bagh", "Shikara ride on Dal Lake"] },
    { title: "Srinagar to Pahalgam — Saffron Fields & the Lidder Valley",
      description: "Drive south past the saffron fields of Pampore and the 9th-century Awantipora ruins, reaching Pahalgam by afternoon. Walk the Lidder riverside while the light lasts. You stay the night here, in the valley rather than driving back.",
      highlights: ["Pampore saffron fields", "Awantipora temple ruins", "Lidder riverside walk", "Night in Pahalgam"] },
    { title: "Christmas Eve — Betaab Valley, then Srinagar",
      description: "The morning is in the mountains above Pahalgam. Betaab Valley is the reliable one in deep winter — Chandanwari and the upper Aru road are usually closed by snow, and your driver will tell you honestly on the day what is open. Drive back to Srinagar in the afternoon.\n\nChristmas Eve in Srinagar is a quiet affair. The Holy Family Catholic Church on Maulana Azad Road and All Saints' Church at Sonwar both date from the early 1900s and hold a service on the night of the 24th. If you would like to attend, tell us when you book and we will arrange your transport and check the timing for you.",
      highlights: ["Betaab Valley, snow permitting", "Pahalgam union cab on 4-Star and 5-Star", "Return to Srinagar", "Christmas Eve service, on request"] },
    { title: "Christmas Day in Gulmarg — Gondola & Snow",
      description: "Christmas morning you head west to Tangmarg, where the winter road begins. From here chained vehicles take over for the climb to Gulmarg — included in your package. Check in, then the Gondola to Kongdoori, and on to Affarwat at nearly 13,000 feet if the upper phase is running. Phase 2 depends on wind and weather each morning.\n\nThe rest of Christmas Day is yours in the snow — skiing, sledging, snow walks, or the meadow and St. Mary's Church under its white roof. You stay the night in Gulmarg.\n\nMost hotels here mark Christmas in some way, usually with dinner and sometimes music. It varies by property and is the hotel's decision, so we do not sell it as a fixed inclusion. If a confirmed Christmas dinner matters to you, tell us when you enquire and we will book a property that has one and confirm it in writing before you pay.",
      highlights: ["Chained vehicle from Tangmarg, included", "Gondola Phase 1 to Kongdoori, included from 3-Star", "Phase 2 to Affarwat, weather permitting", "Christmas night in Gulmarg"] },
    { title: "Sonamarg & a Night on Dal Lake",
      description: "Down from Gulmarg and east along the Sindh River towards Sonamarg, the Meadow of Gold, deep under snow by late December. The road onward to Zojila is shut for the season, so this is a day of river valley, snowfields and long views rather than a climb. Back to Srinagar in the evening for your last night on a traditional Dal Lake houseboat.",
      highlights: ["Sindh River valley drive", "Sonamarg snowfields", "Sonamarg union vehicle on 5-Star", "Night on a Dal Lake houseboat"] },
    { title: "Departure — Fly Home from Srinagar",
      description: "Breakfast on the houseboat, a short Shikara across to the shore, and your transfer to Srinagar airport. If your flight is late enough there is time for saffron, walnuts and pashmina on the way.",
      highlights: ["Breakfast on the houseboat", "Saffron & dry-fruit shopping", "Srinagar airport drop"] },
  ],
  inclusions: [
    "5 nights' stay as per your package (twin sharing), including 1 night in Gulmarg on Christmas Day and 1 night on a Dal Lake houseboat",
    "Daily breakfast and dinner (MAP) — 5 breakfasts and 5 dinners",
    "Private vehicle for Srinagar airport pickup and drop and all sightseeing as per itinerary — sedan on Comfort and 3-Star, Innova Crysta on 4-Star and 5-Star",
    "Chained vehicle for the Tangmarg–Gulmarg winter road, both ways — normally charged separately at the roadside",
    "Gulmarg Gondola Phase 1 — 3-Star, 4-Star and 5-Star packages",
    "Shikara ride on Dal Lake",
    "Local union cab in Pahalgam — 4-Star and 5-Star packages",
    "Sonamarg union vehicle — 5-Star package",
    "Transport to a Christmas Eve church service in Srinagar, on request",
    "All hotel taxes and GST on the package",
    "Support from our Tangmarg-based team throughout the trip",
  ],
  exclusions: [
    "Flights or train to and from Srinagar — we are happy to suggest flights that match the itinerary, at actual fare with no markup",
    "Lunch, and any meals not listed above — left open so you eat where you like, not where we get commission",
    "Gondola Phase 2 to Affarwat — sold on the day at the counter and subject to weather; Phase 1 is included from 3-Star",
    "Christmas dinners or celebrations where the hotel charges for them separately",
    "Skiing, sledging, snowmobile and pony rides — union-controlled rates that change with the season; your driver will tell you the fair rate before you agree",
    "Activities and local union cabs not included in your package (see Compare Packages) — can be added on request",
    "Snow gear and clothing hire",
    "Personal expenses such as laundry, phone calls and tips",
    "Anything not listed under inclusions",
  ],
  faqs: [
    { question: "Which dates does this Christmas package cover?", answer: "Five nights from Tuesday 22 December to Sunday 27 December 2026. Christmas Eve is spent in Srinagar and Christmas Day and night in Gulmarg, on every package. You fly home on the 27th." },
    { question: "Is there a Christmas service we can attend in Srinagar?", answer: "Yes. Srinagar has had a Christian community for over a century, and the Holy Family Catholic Church on Maulana Azad Road and All Saints' Church at Sonwar both hold a service on the night of 24 December. Tell us when you book and we will arrange your transport and confirm the timing for you closer to the date. There is no charge for the transport." },
    { question: "Is there a Christmas party or gala dinner?", answer: "Most Gulmarg hotels mark Christmas in some way — usually a dinner, sometimes music. It varies by property and is decided by the hotel, not by us, so we do not list it as a fixed inclusion. We would rather not promise something we cannot control. If a confirmed Christmas dinner matters to you, say so when you enquire and we will book a hotel that has one and confirm it in writing before you pay." },
    { question: "Will there be snow at Christmas?", answer: "Gulmarg at 8,700 feet is usually well under snow by the last week of December, and this is the point at which Kashmir's winter properly begins. Nobody can promise fresh snowfall on a particular day — that would be dishonest — but Christmas week has strong odds, and it is quieter and cheaper than New Year." },
    { question: "What is the chained vehicle, and why do you mention it?", answer: "Once snow settles on the road above Tangmarg, only vehicles fitted with chains are allowed up to Gulmarg. It is a separate hire, and most operators do not include it — travellers find out at Tangmarg and pay on the spot. It is inside this package price, both ways." },
    { question: "Will the Gulmarg Gondola be running?", answer: "Phase 1 to Kongdoori runs through most of winter and is included from the 3-Star package. Phase 2 to Affarwat, at nearly 13,000 feet, depends on wind and weather and is decided each morning — it is bought at the counter on the day. If Phase 2 is shut during your stay, we will tell you rather than let you queue." },
    { question: "What happens if the road closes or our flight is cancelled?", answer: "Heavy snowfall can close the Gulmarg road or delay Srinagar flights for a day. Our office is at Reram, Tangmarg, on that road, so we know the position early. If a day is lost we rearrange the itinerary and, where a hotel or service is not used, we refund it. What we cannot do is control the weather, and we will not pretend otherwise." },
    { question: "How cold is it, and what should we pack?", answer: "Expect daytime highs near freezing in Srinagar and below freezing in Gulmarg, with nights well below. Bring thermals, a heavy waterproof jacket, waterproof shoes with grip, gloves, a woollen cap and sunglasses — snow glare is strong. Heavy snow boots and jackets can be hired in Gulmarg if you would rather not carry them." },
    { question: "Is this suitable for children or elderly parents?", answer: "Yes, and Christmas week suits families better than New Year — it is quieter and the hotels are calmer. One caution: Gulmarg is at altitude and snow makes walking slower. For elderly travellers we would suggest the 4-Star or 5-Star packages, which include the Pahalgam union cab and a larger vehicle. Tell us who is travelling and we will adjust the pace." },
    { question: "What is the price, and can we change the dates?", answer: "Every price on this page is the total for 2 adults on twin sharing, for 5 nights, with breakfast and dinner daily, a private vehicle, the chained vehicle to Gulmarg and all hotel taxes. There are no roadside extras added later — what is not included is listed in full on this page. The dates are built around Christmas, but we can shift or extend them, change hotels, add a Gulmarg night or swap a day. We will share the revised price in writing before you book." },
  ],
};

type Pkg = { description: string; highlights: string[]; mealPlan: string; vehicle: string; badge?: string; stayFix?: { night: number; from: string; to: string }[] };
const pkgContent: Record<string, Pkg> = {
  Comfort: {
    description: "The best-priced way to spend Christmas in Kashmir, with clean, comfortable hotels and a private sedan throughout. Same route as the other packages — a night in Pahalgam, Christmas night in Gulmarg, a houseboat to finish. The difference is hotel class and which activities are included.",
    highlights: ["Christmas night in Gulmarg", "Night in Pahalgam and a Dal Lake houseboat", "Chained vehicle to Gulmarg included", "Private sedan throughout"],
    mealPlan: "Breakfast + Dinner", vehicle: "Private sedan",
    stayFix: [{ night: 2, from: "srinagar", to: "pahalgam" }, { night: 4, from: "srinagar", to: "gulmarg" }],
  },
  "3-Star": {
    description: "Christmas night in Gulmarg with the Gondola Phase 1 included, 3-star hotels through the trip and a houseboat on Dal Lake to finish. This is the package most couples and small families pick.",
    highlights: ["Christmas night in Gulmarg", "Gulmarg Gondola Phase 1 included", "Night in Pahalgam and a Dal Lake houseboat", "Chained vehicle to Gulmarg included"],
    mealPlan: "Breakfast + Dinner", vehicle: "Private sedan", badge: "Best Value",
    stayFix: [{ night: 4, from: "srinagar", to: "gulmarg" }],
  },
  "4-Star": {
    description: "Christmas in 4-star properties with a private Innova Crysta for the whole trip, and the Pahalgam union cab included so you are not negotiating rates at the taxi stand on Christmas Eve morning.",
    highlights: ["Christmas night in Gulmarg, 4-star hotels", "Private Innova Crysta throughout", "Gondola Phase 1 and Pahalgam union cab included", "Premium houseboat on Dal Lake"],
    mealPlan: "Breakfast + Dinner", vehicle: "Innova Crysta",
  },
  "5-Star": {
    description: "The fullest version of the trip: 5-star stays, Christmas night in Gulmarg, and every included ground service on the list — Gondola Phase 1, the Pahalgam union cab and the Sonamarg union vehicle — so nothing is bought at a counter on the day.",
    highlights: ["5-star hotels and a premium houseboat", "Christmas night in Gulmarg", "Every included ground service — no roadside extras", "Private Innova Crysta throughout"],
    mealPlan: "Breakfast + Dinner", vehicle: "Innova Crysta",
  },
};

const clip = (v: unknown, n = 70) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s == null ? "NULL" : s.replace(/\s+/g, " ").slice(0, n) + (s.length > n ? "…" : ""); };
const line = (s: string) => JSON.parse(s).map((x: any) => x.destination[0].toUpperCase() + (x.stayType === "HOUSEBOAT" ? "(hb)" : "")).join("-");

async function main() {
  const cur = await prisma.occasionOffer.findUnique({ where: { slug: SLUG }, include: { packages: { orderBy: { sortOrder: "asc" } } } });
  if (!cur) throw new Error("offer not found");
  if (cur.published) throw new Error("offer is published — refusing");
  if (cur.packages.length !== 4) throw new Error("expected 4 packages");
  const curDays = JSON.parse(cur.itinerary) as { destination: string; image: string }[];
  const expectDest = ["srinagar", "pahalgam", "pahalgam", "gulmarg", "sonamarg", "srinagar"];
  if (curDays.map((d) => d.destination).join() !== expectDest.join()) throw new Error("itinerary destinations changed since inspection");

  fs.mkdirSync(DIR, { recursive: true });
  const backupFile = DIR + "/christmas-backup.json";
  if (process.env.APPLY === "1" || !fs.existsSync(backupFile)) fs.writeFileSync(backupFile, JSON.stringify({ takenAt: new Date().toISOString(), offer: cur }, null, 2));
  console.log("Backup:", backupFile, fs.statSync(backupFile).size, "bytes\n");

  const patch = offerPatchSchema.parse({
    metaTitle: offerContent.metaTitle, metaDesc: offerContent.metaDesc, shortDescription: offerContent.shortDescription,
    heroTitle: offerContent.heroTitle, heroSubtitle: offerContent.heroSubtitle, ctaLabel: offerContent.ctaLabel,
    overview: offerContent.overview, whyThisOffer: offerContent.whyThisOffer,
    itinerary: curDays.map((d, i) => ({ destination: d.destination, image: d.image, ...offerContent.days[i] })),
    inclusions: offerContent.inclusions, exclusions: offerContent.exclusions, faqs: offerContent.faqs,
  });
  const offerData = {
    metaTitle: patch.metaTitle || null, metaDesc: patch.metaDesc || null, shortDescription: patch.shortDescription || null,
    heroTitle: patch.heroTitle || null, heroSubtitle: patch.heroSubtitle || null, ctaLabel: patch.ctaLabel || null,
    overview: patch.overview || null,
    whyThisOffer: JSON.stringify(patch.whyThisOffer), itinerary: JSON.stringify(patch.itinerary),
    inclusions: JSON.stringify(patch.inclusions), exclusions: JSON.stringify(patch.exclusions), faqs: JSON.stringify(patch.faqs),
  };

  const pkgOps = cur.packages.map((p) => {
    const c = pkgContent[p.name];
    if (!c) throw new Error("no content for " + p.name);
    const stays = JSON.parse(p.stays) as { destination: string; stayType: string; category: string }[];
    for (const f of c.stayFix ?? []) {
      if (stays[f.night - 1].destination !== f.from) throw new Error(`${p.name} night ${f.night} is ${stays[f.night - 1].destination}, expected ${f.from}`);
      stays[f.night - 1] = { ...stays[f.night - 1], destination: f.to };
    }
    const parsed = offerPackageInputSchema.parse({
      name: p.name, displayName: p.displayName, description: c.description, priceForTwo: p.priceForTwo,
      originalPriceForTwo: p.originalPriceForTwo, published: p.published, image: p.image ?? "",
      highlights: c.highlights, inclusions: JSON.parse(p.inclusions), stays,
      compareValues: JSON.parse(p.compareValues), hotels: JSON.parse(p.hotels),
      badge: c.badge ?? p.badge ?? "", mealPlan: c.mealPlan, vehicle: c.vehicle,
    });
    return { id: p.id, name: p.name, before: p, data: {
      description: parsed.description || null, highlights: JSON.stringify(parsed.highlights), stays: JSON.stringify(parsed.stays),
      badge: parsed.badge || null, mealPlan: parsed.mealPlan || null, vehicle: parsed.vehicle || null } };
  });

  console.log("=== OccasionOffer", cur.id, SLUG);
  for (const [k, v] of Object.entries(offerData)) console.log(` ${k.padEnd(17)} ${clip((cur as any)[k], 30).padEnd(34)} → ${clip(v, 80)}`);
  for (const o of pkgOps) { console.log(`\n=== Package ${o.name} (${o.id}) — priceForTwo ${o.before.priceForTwo} UNCHANGED`); for (const [k, v] of Object.entries(o.data)) { const b = (o.before as any)[k]; if (b !== v) console.log(` ${k.padEnd(12)} ${clip(b, 30).padEnd(34)} → ${clip(v, 80)}`); } }
  console.log("\nStays (S=srinagar P=pahalgam G=gulmarg):");
  for (const o of pkgOps) console.log(` ${o.name.padEnd(8)} ${line(o.before.stays)}  →  ${line(o.data.stays)}`);

  if (process.env.APPLY !== "1") { console.log("\nDRY RUN — nothing written."); return; }
  await prisma.$transaction([
    prisma.occasionOffer.update({ where: { slug: SLUG }, data: offerData }),
    ...pkgOps.map((o) => prisma.occasionOfferPackage.update({ where: { id: o.id }, data: o.data })),
  ]);
  console.log("\nAPPLIED in one transaction.");
}
main().finally(() => prisma.$disconnect());
