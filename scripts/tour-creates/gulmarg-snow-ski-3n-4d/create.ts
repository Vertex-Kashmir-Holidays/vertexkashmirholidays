// Creates the "Gulmarg Snow & Ski Tour Package" Tour + its related rows in ONE atomic nested write
// (Tour, 10 Faq rows via relatedFaqs, 2 TourDestination, 5 ActivityTour, 1 collection link).
// DRY RUN unless APPLY=1. Always creates published=false. Undo with delete.ts (same folder).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "gulmarg-snow-ski-tour-package-3n-4d";
const FAQ_CATEGORY_SLUG = "trip-planning-pacing-comparison";
const j = (v: unknown) => JSON.stringify(v);

const faqs: { question: string; answer: string }[] = [
  {
    question: "Why only two nights in Gulmarg and not a full Kashmir circuit?",
    answer:
      "Because this trip is for people whose reason for coming is snow. A 5N/6D circuit gives you Pahalgam and Sonamarg as well, but it also gives you a Gulmarg day trip rather than Gulmarg itself. If you want the full valley, our 5N/6D packages do that properly. If you want Gulmarg, this is the one.",
  },
  {
    question: "Will there be snow?",
    answer:
      "Gulmarg at 8,700 feet is under snow through December, January and February in almost every year, and January is the heaviest month. What nobody can promise is fresh snowfall on your particular dates — anyone who does is guessing. We will tell you the real conditions before you travel.",
  },
  {
    question: "What is the chained vehicle, and why do you mention it?",
    answer:
      "Once snow settles on the road above Tangmarg, only vehicles fitted with chains are allowed up to Gulmarg. It is a separate hire, and most operators do not include it — travellers find out at Tangmarg and pay on the spot with no choice. It is inside this package price, both ways.",
  },
  {
    question: "I have never skied. Can I learn here?",
    answer:
      "Yes. Gulmarg has gentle beginner slopes near the Gondola base and instructors available on the day. A half-day lesson is the usual starting point. Gear can be hired there too. We have not included it in the price because rates are union-controlled and change through the season — but your driver will tell you the fair rate before you agree to anything.",
  },
  {
    question: "Will the Gondola be running?",
    answer:
      "Phase 1 to Kongdoori runs through most of winter and is included in your package. Phase 2 to Affarwat, at nearly 13,000 feet, is decided each morning on wind and weather and is bought at the counter on the day. If Phase 2 is shut during your stay we will tell you rather than let you queue.",
  },
  {
    question: "How cold does it get, and what should we pack?",
    answer:
      "Expect daytime temperatures near or below freezing in Gulmarg and well below at night, with Srinagar a few degrees warmer. Thermals, a waterproof jacket, waterproof shoes with grip, gloves, a woollen cap and sunglasses. Heavy snow jackets and boots can be hired in Gulmarg if you would rather not carry them.",
  },
  {
    question: "What happens if the road closes or our flight is cancelled?",
    answer:
      "Heavy snowfall can close the Gulmarg road or delay Srinagar flights for a day. Our office is at Reram, Tangmarg, on that road, so we know the position early. If a day is lost we rearrange the itinerary and, where a hotel or service is not used, we refund it. What we cannot do is control the weather, and we will not pretend otherwise.",
  },
  {
    question: "Is this suitable for children or elderly parents?",
    answer:
      "For older children, yes — sledging and the Gondola work well and most kids love the snow. For toddlers and infants we would not recommend it; altitude and deep snow make everything harder. For elderly travellers it depends on mobility: the Gondola is easy, but walking in snow is slow and tiring. Tell us who is travelling and we will be honest about whether it suits them.",
  },
  {
    question: "Can we add Pahalgam or Sonamarg?",
    answer:
      "Yes, as extra nights. Sonamarg works as a day trip from Srinagar in winter, though the road beyond towards Zojila is closed for the season. Pahalgam needs a night of its own to be worth it. Tell us what you want and we will quote the revised trip in writing before you book.",
  },
  {
    question: "What is included in the price, and are there extras later?",
    answer:
      "The price covers 3 nights on twin sharing, breakfast and dinner daily, a private vehicle throughout, the chained vehicle to Gulmarg both ways, Gondola Phase 1, a Shikara ride and all hotel taxes. What is not included is listed in full on this page, with real amounts where we know them. There is nothing collected at the roadside that we have not told you about here.",
  },
];

const itinerary = [
  {
    day: 1,
    title: "Arrive in Srinagar — Dal Lake & Mughal Gardens",
    image: "",
    meals: "Dinner",
    stay: "Hotel in Srinagar",
    description:
      "Your driver meets you at Srinagar airport and takes you to your hotel. In the afternoon, the Nishat and Shalimar Mughal Gardens — bare and quiet in winter, with the Zabarwan hills white behind them — and a Shikara ride on Dal Lake as the light goes. Srinagar evenings in winter are cold, so dinner is at your hotel.",
    travelTips:
      "Try to land before 2 PM. Winter light goes early and the gardens are worth seeing before dusk. Srinagar flights are occasionally delayed by fog or snow in January — keep the day flexible.",
  },
  {
    day: 2,
    title: "Up the Snow Road to Gulmarg — Gondola & First Night",
    image: "",
    meals: "Breakfast, Dinner",
    stay: "Hotel in Gulmarg",
    description:
      "Drive west to Tangmarg, where the winter road begins. From here chained vehicles take over for the climb to Gulmarg — included in your package, and normally an extra charged at the roadside. Check in, then the Gulmarg Gondola: Phase 1 to Kongdoori is included, and Phase 2 to Affarwat at nearly 13,000 feet is available at the counter if it is running that day. The afternoon is in the snow — the meadow, St. Mary's Church under its white roof, and the first sight of the Pir Panjal from above.",
    travelTips:
      "Gondola Phase 2 depends on wind and is decided each morning. Go early if it is open — queues build after 11 AM. Snow boots and jackets can be hired at the base if you would rather not carry them.",
  },
  {
    day: 3,
    title: "A Full Day in Gulmarg — Ski, Sledge or Simply Walk",
    image: "",
    meals: "Breakfast, Dinner",
    stay: "Hotel in Gulmarg",
    description:
      "The whole day is yours in the snow, and this is the day the trip exists for. Beginners can take a ski lesson on the gentle slopes near the base — instructors and gear are available on the spot. Sledging and snowmobiles run all day. If you would rather not do any of it, the walk towards Khilanmarg through the pines is one of the best hours in Kashmir. Your second night is in Gulmarg.",
    travelTips:
      "Ski hire and lessons are union-controlled and paid on the day. Ask your driver what the fair rate is before you agree — he knows, and he will tell you. Sun glare on snow is strong; sunglasses matter more than you expect.",
  },
  {
    day: 4,
    title: "Down the Mountain & Departure",
    image: "",
    meals: "Breakfast",
    stay: "",
    description:
      "Breakfast in Gulmarg with the snow outside, then down the chained road to Tangmarg and on to Srinagar airport. If your flight is late enough there is time for saffron, walnuts and pashmina on the way.",
    travelTips:
      "Allow extra time in heavy snow — the descent from Gulmarg is slower than the map suggests. For an afternoon flight we leave Gulmarg by 9 AM.",
  },
];

const tour = {
  title: "Gulmarg Snow & Ski Tour Package",
  slug: SLUG,
  category: "PREMIUM" as const,
  region: "KASHMIR" as const,
  duration: 4,
  priceFrom: 16999,
  minPersons: 2,
  priceWas: null,
  discountPct: null, // priceWas / discountPct deliberately empty
  badge: "Winter Only",
  badgeColor: "blue",
  bestseller: true,
  rating: 0,
  reviewCount: 0,
  published: false,
  formMode: "BOTH" as const,
  startCity: "Srinagar",
  pickupDrop: "Srinagar International Airport (SXR)",
  tourType: "Private Winter Tour",
  transport: "Sedan or SUV, plus chained vehicle for the Gulmarg road",
  difficulty: "Easy",
  happyCount: null,
  coverImage: null,
  gallery: "[]",
  batches: "[]",
  packageOptions: "[]",
  relatedTours: "[]",
  budgetBreakdown: "[]",
  localTravelTips: "[]",
  metaTitle: "Gulmarg Snow & Ski Tour Package",
  metaDesc:
    "Three nights, two in Gulmarg itself. Snow, Gondola and skiing from December to February. Chained vehicle included. One clear price, no roadside extras.",
  ogTitle: "Gulmarg Snow & Ski Tour Package — 3 Nights 4 Days",
  tagline: "Two nights in Gulmarg itself — not a day trip from Srinagar.",
  excerpt:
    "A short winter trip built around Gulmarg rather than Srinagar. One night on Dal Lake to arrive, then two nights at 8,700 feet with the snow outside your door — Gondola, ski slopes and Affarwat. The chained vehicle up the winter road is included, which most quotes leave out.",
  description: [
    "Most Kashmir winter packages are Srinagar packages with a Gulmarg day trip attached. You leave at eight, spend two hours in the snow, and are back in the city before dark — having lost most of the day to the road.",
    "This one is built the other way round. One night in Srinagar to arrive and see Dal Lake, then two full nights in Gulmarg itself. You wake up in the snow, ride the Gondola without a queue-day deadline, and have a whole free day for skiing, sledging or simply walking in it.",
    "Four days is enough for that and not a day more. If you want Pahalgam and Sonamarg as well, our 5N/6D circuits do that properly. This trip does one thing: Gulmarg in winter.",
    "The logistics behind it are real. Once snow settles above Tangmarg, only chained vehicles are allowed up to Gulmarg — a separate hire that most operators collect at the roadside when you have no choice. It is inside this price, both ways, along with Gondola Phase 1, the airport transfers and all hotel taxes.",
    "Our office is at Reram, Tangmarg, at the foot of that road. It is the route our drivers take every day of winter.",
  ].join("\n\n"),
  bestTime:
    "December to February, when Gulmarg is under snow and the ski season is open. The Gondola runs through most of winter and the slopes are at their best from mid-January.",
  bestTimeDetail: `<p><strong>December:</strong> Snow usually settles from the first half of the month. Christmas and New Year are the busiest weeks of the winter and hotels price accordingly — book early.</p>

<p><strong>January:</strong> The heaviest snow of the year, and the best skiing. Fresh falls come in cycles through the month. Cold, quiet and at its most beautiful. This is the month to come if snow is the point.</p>

<p><strong>February:</strong> Still full winter with a reliable base, slightly milder, and fewer crowds than December. Good value and good conditions.</p>

<p><strong>A note on honesty:</strong> nobody can promise fresh snowfall on a particular date. What we can say is that Gulmarg at 8,700 feet is almost always under snow through these three months, and that we will tell you the real conditions before you travel rather than after.</p>`,
  highlights: j([
    "Two nights in Gulmarg: Not a day trip — you stay where the snow is, both nights at 8,700 feet.",
    "Chained vehicle included: The winter hire from Tangmarg up to Gulmarg, both ways, inside the price.",
    "Gulmarg Gondola: Phase 1 to Kongdoori included, with Phase 2 to Affarwat available on the day.",
    "A full free day: One whole day in Gulmarg for skiing, sledging or snow walks, at your own pace.",
    "Dal Lake to begin: A night in Srinagar with the Mughal Gardens and a Shikara ride.",
    "Short and focused: Four days, one destination, done properly.",
    "One clear price: All hotel taxes and transfers included, with nothing collected at the roadside.",
  ]),
  perfectFor: j([
    "Snow first-timers: Anyone whose main reason for coming to Kashmir is to see and play in real snow.",
    "Short leave: Travellers with three or four days rather than a full week.",
    "Beginner skiers: Gulmarg has gentle learning slopes and instructors are available on the spot.",
    "Couples: Two nights at altitude with the valley below is a better winter break than a city hotel.",
    "Families with older children: Sledging, snow walks and the Gondola all work well for kids who can handle cold.",
    "Repeat visitors: People who have already done the Srinagar-Pahalgam-Sonamarg circuit and want depth instead.",
  ]),
  notIdealFor: j([
    "First-time Kashmir visitors wanting everything: If you want Pahalgam and Sonamarg too, take a 5N/6D circuit instead.",
    "Travellers avoiding cold: Gulmarg is below freezing for most of the day in January. This trip is about being in it.",
    "Very young children: Altitude and deep snow make this harder with toddlers or infants.",
    "Guaranteed-snowfall seekers: Snow on the ground is near-certain; fresh snowfall on your exact dates is not, and we will not pretend otherwise.",
  ]),
  itinerary: j(itinerary),
  inclusions: j([
    "3 nights' stay on twin sharing — 1 night in Srinagar, 2 nights in Gulmarg",
    "Daily breakfast and dinner (MAP) — 3 breakfasts and 3 dinners",
    "Private vehicle for Srinagar airport pickup and drop and all sightseeing as per itinerary",
    "Chained vehicle for the Tangmarg–Gulmarg winter road, both ways — normally charged separately at the roadside",
    "Gulmarg Gondola Phase 1 to Kongdoori, return",
    "Shikara ride on Dal Lake",
    "All hotel taxes and GST on the package",
    "Tolls, parking and driver allowances",
    "Support from our Tangmarg-based team throughout the trip",
  ]),
  exclusions: j([
    "Flights or train to and from Srinagar — we are happy to suggest flights that match the itinerary, at actual fare with no markup",
    "Lunch, and any meals not listed above — left open so you eat where you like, not where we get commission",
    "Gondola Phase 2 to Affarwat — sold at the counter on the day and subject to weather",
    "Ski hire, ski lessons, snowmobile, sledge and pony rides — union-controlled rates that change through the season; your driver will tell you the fair rate before you agree",
    "Snow gear and winter clothing hire",
    "Mughal Gardens entry tickets",
    "Personal expenses such as laundry, phone calls and tips",
    "Anything not listed under inclusions",
  ]),
  accommodation: j([
    {
      location: "Srinagar — 1 night",
      description:
        "A comfortable hotel close to Dal Lake, chosen for warmth and reliable heating rather than size. Winter in Srinagar is cold indoors as well as out, and this matters more than a view.",
    },
    {
      location: "Gulmarg — 2 nights",
      description:
        "A hotel in Gulmarg itself, within reach of the Gondola base. Properties in Gulmarg are fewer and fill early in winter, so we confirm yours before you pay rather than promising a category and sorting it later.",
    },
  ]),
  thingsToCarry: j([
    {
      item: "Thermal base layers",
      reason:
        "Gulmarg is below freezing for most of the day in January. Layers matter more than one thick coat.",
      mandatory: true,
    },
    {
      item: "Waterproof jacket and trousers",
      reason: "Snow is wet. A warm coat that soaks through is worse than useless.",
      mandatory: true,
    },
    {
      item: "Waterproof shoes with grip",
      reason: "The walk from the car to the hotel is snow. Ordinary trainers will not do.",
      mandatory: true,
    },
    {
      item: "Gloves and a woollen cap",
      reason:
        "Most heat is lost through the head and hands, and you will want your hands out for photos.",
      mandatory: true,
    },
    {
      item: "Sunglasses",
      reason:
        "Snow glare at altitude is stronger than most people expect and causes real eye strain.",
      mandatory: true,
    },
    {
      item: "Moisturiser and lip balm",
      reason: "Dry cold at 8,700 feet cracks skin quickly.",
      mandatory: false,
    },
    {
      item: "Power bank",
      reason: "Cold drains phone batteries fast, and you will be taking photographs all day.",
      mandatory: false,
    },
    {
      item: "A postpaid SIM",
      reason: "Out-of-state prepaid SIMs do not work in Kashmir. Switch before you fly.",
      mandatory: true,
    },
  ]),
  personalExpenses: j([
    { activity: "Gondola Phase 2 to Affarwat", cost: "approx ₹1,100 per person", mandatory: false },
    {
      activity: "Ski hire (skis, boots, poles)",
      cost: "approx ₹500–800 per day",
      mandatory: false,
    },
    {
      activity: "Ski lesson with instructor",
      cost: "approx ₹800–1,200 per half day",
      mandatory: false,
    },
    { activity: "Snowmobile ride", cost: "approx ₹2,000", mandatory: false },
    { activity: "Sledge ride", cost: "approx ₹500–800", mandatory: false },
    { activity: "Pony ride", cost: "union rate, varies by route", mandatory: false },
    { activity: "Snow jacket and boot hire", cost: "approx ₹300–500 per day", mandatory: false },
    {
      activity: "Mughal Gardens entry",
      cost: "approx ₹100 per person per garden",
      mandatory: false,
    },
    { activity: "Lunch", cost: "approx ₹300–600 per person per day", mandatory: false },
  ]),
  importantNotes: j([
    {
      text: "Gondola Phase 2 to Affarwat is decided each morning based on wind and weather. Phase 1 runs through most of winter. We will tell you the position rather than let you queue.",
      reviewNote: "",
    },
    {
      text: "Heavy snowfall can close the Gulmarg road for a day. Our office is at Reram, Tangmarg, on that road, so we know early. If a day is lost we rearrange, and where a hotel or service is not used we refund it.",
      reviewNote: "",
    },
    {
      text: "Srinagar flights are occasionally delayed or cancelled by fog and snow in January. Keep your return day flexible where you can, and do not book a tight onward connection.",
      reviewNote: "",
    },
    {
      text: "Ski hire, lessons and snow activities are union-controlled and paid on the day. We do not mark them up and we do not take commission — your driver will tell you the fair rate.",
      reviewNote: "",
    },
    {
      text: "Gulmarg has fewer hotels than Srinagar and they fill early in winter, especially around Christmas and New Year. Book ahead for December and January.",
      reviewNote: "",
    },
  ]),
  whyItineraryWorks: [
    "Four days, one destination. Most winter packages spread three or four places across five nights, which means you spend your mornings in a vehicle. This trip has one long drive on day one and one on day four, and everything in between is in Gulmarg.",
    "Two nights at 8,700 feet is what makes it work. With one night you are checking in and out around the Gondola. With two, you have a full free day — and that free day is when people actually enjoy the snow rather than photograph it on a schedule.",
    "The Srinagar night is at the start, not the end. Winter flights into Srinagar are the ones that get delayed, so we absorb that on arrival day rather than on the day you are trying to reach Gulmarg.",
  ].join("\n\n"),
  meals: [
    "Breakfast and dinner are included every day — three of each. Both are at your hotel, which in winter is the right place to eat: Gulmarg has few restaurants open after dark and the walk between them in snow is not pleasant.",
    "Lunch is left open deliberately. You will be out during the day and we would rather you ate where you felt like eating than where we had an arrangement.",
  ].join("\n\n"),
  transportDetail: [
    "A private sedan or SUV for the whole trip — airport pickup, Srinagar sightseeing, the drive to Tangmarg and back, and your airport drop. No sharing with other guests.",
    "From Tangmarg upward, the winter road requires a chained vehicle. That is a separate local hire and it is included in your package, both ways. Most operators do not include it and collect it at the roadside instead, which is the single most common surprise cost on a Kashmir winter trip.",
  ].join("\n\n"),
  whyVertexBlurb: [
    "Our office is at Reram, Tangmarg, at the foot of the Gulmarg road. This is not a marketing line — it is why we can tell you at 7 AM whether the road is open, and why our drivers handle the chained ascent as routine rather than as a problem.",
    "We are licensed by J&K Tourism, we invoice with GST, and we take payment through a proper gateway. Everything included is listed on this page and everything not included is listed too, with real amounts where we know them.",
  ].join("\n\n"),
  ctaHeadline: "See Kashmir While It Is Still White",
  ctaBody:
    "Tell us your dates and how many of you are travelling, and we will confirm availability and the exact price for your group. Gulmarg hotels are limited and fill early for December and January, so the sooner we know, the better the options.",
};

const slugify = (q: string) =>
  q
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "") || "question";

async function main() {
  if (await prisma.tour.findUnique({ where: { slug: SLUG }, select: { id: true } }))
    throw new Error("tour slug already exists");
  const [cat, dests, coll, acts] = await Promise.all([
    prisma.faqCategory.findUnique({ where: { slug: FAQ_CATEGORY_SLUG } }),
    prisma.destination.findMany({
      where: { slug: { in: ["srinagar", "gulmarg"] } },
      select: { id: true, slug: true },
    }),
    prisma.tourCollection.findUnique({
      where: { slug: "kashmir-tour-packages" },
      select: { id: true },
    }),
    prisma.activity.findMany({
      where: {
        slug: {
          in: [
            "skiing-in-gulmarg",
            "gulmarg-gondola-ride",
            "snowmobile-gulmarg",
            "shikara-ride",
            "pony-ride-pahalgam-gulmarg",
          ],
        },
      },
      select: { id: true, slug: true },
    }),
  ]);
  if (!cat || dests.length !== 2 || !coll || acts.length !== 5)
    throw new Error("a linked row is missing");
  // FAQ slugs: same algorithm as generateFaqSlug, resolved up-front so the write is one atomic call
  const taken = new Set((await prisma.faq.findMany({ select: { slug: true } })).map((f) => f.slug));
  const faqRows = faqs.map((f, i) => {
    const base = slugify(f.question);
    let slug = base,
      n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;
    taken.add(slug);
    // DRAFT: published FAQs are listed on /faq and /faq/[slug] immediately; flip to PUBLISHED together with the tour.
    return {
      question: f.question,
      shortAnswer: f.answer,
      answer: f.answer,
      slug,
      categoryId: cat.id,
      status: "DRAFT" as const,
      featured: false,
      sortOrder: i + 1,
      placements: [] as never[],
    };
  });
  if (tour.published !== false || tour.priceWas !== null || tour.discountPct !== null)
    throw new Error("guard");

  console.log("INSERT PLAN (one nested prisma.tour.create → one transaction)");
  console.log(
    ` Tour: ${tour.title} | slug ${SLUG} | ${tour.category}/${tour.region} | ${tour.duration}d | ₹${tour.priceFrom} pp @ min ${tour.minPersons} | priceWas ${tour.priceWas} discountPct ${tour.discountPct} | published=${tour.published} | bestseller ${tour.bestseller} rating ${tour.rating} | badge "${tour.badge}"/${tour.badgeColor} | formMode ${tour.formMode}`,
  );
  console.log(
    ` JSON cols: itinerary ${itinerary.length}d, highlights 7, perfectFor 6, notIdealFor 4, inclusions 9, exclusions 8, accommodation 2, thingsToCarry 8, personalExpenses 9, importantNotes 5 (gallery/batches/budget/localTips/packageOptions/relatedTours = [])`,
  );
  console.log(
    ` NULL: coverImage, coverImageMobile, ogImage, ogDescription, accommodationImage, happyCount`,
  );
  console.log(` TourDestination ×2: ${dests.map((d) => d.slug).join(", ")}`);
  console.log(` ActivityTour ×5: ${acts.map((a) => a.slug).join(", ")}`);
  console.log(` collections connect: kashmir-tour-packages`);
  console.log(` Faq ×10 (category "${cat.name}", status DRAFT, shortAnswer = answer):`);
  faqRows.forEach((f) => console.log(`   ${f.sortOrder}. ${f.slug}`));
  if (process.env.APPLY !== "1") return console.log("\nDRY RUN — nothing written.");

  const created = await prisma.tour.create({
    data: {
      ...tour,
      destinations: { create: dests.map((d) => ({ destinationId: d.id })) },
      activities: { create: acts.map((a) => ({ activityId: a.id })) },
      collections: { connect: [{ id: coll.id }] },
      relatedFaqs: { create: faqRows },
    },
    select: { id: true, slug: true },
  });
  console.log("\nCREATED", created);
}
main().finally(() => prisma.$disconnect());
