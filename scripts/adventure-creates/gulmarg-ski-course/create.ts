// Creates the "Gulmarg Ski Course" Adventure + its 8 Faq rows in ONE atomic nested write.
// DRY RUN unless APPLY=1. Always creates published=false, FAQs DRAFT. Undo with delete.ts (same folder).
// Images are DEMO placeholders (3 existing Gulmarg winter images, repeated) — replace before publishing.
import { PrismaClient } from "@prisma/client";
import { EXTRA_ACTIVITIES, EXTRA_HIGHLIGHTS } from "./extras";

const prisma = new PrismaClient();
const SLUG = "gulmarg-ski-course";
const FAQ_CATEGORY_SLUG = "trip-planning-pacing-comparison";
const j = (v: unknown) => JSON.stringify(v);

// Demo images — already in the repo / media gallery.
const IMG_SKIER = "/hero/gulmarg-winter-lg.webp";
const IMG_SKIER_MOBILE = "/hero/gulmarg-winter.webp";
const CLD = "https://res.cloudinary.com/dgvyci9jk/image/upload";
const IMG_GONDOLA_TALL = `${CLD}/v1787429943/vertex-kashmir/prod/gulmarg/1787429943804-3wtaav.webp`;
const IMG_GONDOLA_WIDE = `${CLD}/v1787429946/vertex-kashmir/prod/gulmarg/1787429946827-z3e0yx.webp`;
const DEMO = [IMG_GONDOLA_WIDE, IMG_SKIER, IMG_GONDOLA_TALL];
const demo = (i: number) => DEMO[i % DEMO.length];

const faqs: { question: string; answer: string }[] = [
  {
    question: "Do I need any skiing experience?",
    answer:
      "None at all for the 5 and 7-day courses — both start from standing on skis for the first time. The 12-day also starts from zero, and takes you considerably further. If you have skied before, tell us and we will place you at the right point rather than repeating what you know.",
  },
  {
    question: 'What does "maximum three students per coach" actually mean?',
    answer:
      "Your coach has you and at most two others, for the whole course. Most Gulmarg group courses run eight or more to one instructor, which means a lot of waiting and very little individual correction. The alternative is a one-to-one private course at roughly ₹45,000 upward for a week. Three to a coach costs much closer to a group course and teaches much closer to a private one.",
  },
  {
    question: "Which course should I take?",
    answer:
      "The 7-day is what we would recommend to most people — six ski days is enough to finish skiing beginner slopes independently and linking turns on Gondola Phase 1 terrain. Take the 5-day if you cannot spare a week. Take the 12-day if you want to finish skiing parallel on intermediate runs rather than just getting down.",
  },
  {
    question: "Why are lift passes not included?",
    answer:
      "Because what you need depends on your level, and it changes through the course. A first-timer on the nursery slope needs a drag lift pass at around ₹350 a day. Once you reach Gondola Phase 1 terrain, that is ₹1,200–1,500 a day. Bundling them would mean beginners paying for passes they never use. Your coach tells you each morning what to buy.",
  },
  {
    question: "What should I bring?",
    answer:
      "Thermals, a waterproof jacket and trousers, gloves, a woollen cap and sunglasses or goggles — snow glare at altitude is stronger than most people expect. Skis, boots, poles and helmet are provided. Ski clothing can be hired in Gulmarg if you would rather not buy it for one trip.",
  },
  {
    question: "When can I start? Are there fixed dates?",
    answer:
      "Courses run on rolling start dates through the season, roughly December to March. You pick your dates rather than fitting a fixed batch. January has the most reliable snow; December and March are quieter and often better value on accommodation.",
  },
  {
    question: "What happens if the weather is bad?",
    answer:
      "Snowfall is why you are coming, so a snowy day is a ski day. What stops a session is high wind closing the lifts or a road closure, and our office is at Reram on the Gulmarg road so we know early. We make up lost sessions within your course where we can. If a day cannot be made up, we tell you rather than quietly dropping it.",
  },
  {
    question: "Is there an age limit?",
    answer:
      "We teach from about eight years upward on these courses. For younger children a short private lesson suits better than a structured course. There is no upper limit, but skiing is physical — if you have knee, back or heart concerns, talk to your doctor and then to us.",
  },
];

const highlights = [
  {
    emoji: "🎿",
    title: "Three to a coach, never more",
    description:
      "Most Gulmarg courses put eight or more students with one instructor, or charge private rates for one-to-one. We cap every batch at three. You get real correction on every run instead of waiting your turn, at a price much closer to a group course than a private one.",
  },
  {
    emoji: "⏱️",
    title: "Half-days on arrival and departure",
    description:
      "Your arrival afternoon and departure morning are ski sessions, not waiting around. A five-day course gives you four days on snow, not three. It is the difference between learning to stand up and learning to link turns.",
  },
  {
    emoji: "💳",
    title: "One price, everything inside it",
    description:
      "Coach, equipment, your room, all meals, airport transfers and daily transport to the slopes. Lift passes are the only thing bought separately, and we tell you exactly what they cost before you come.",
  },
  {
    emoji: "🏔️",
    title: "Local instructors, local roads",
    description:
      "Our office is at Reram, Tangmarg, at the foot of the Gulmarg road. We know the conditions before anyone and the chained winter drive is routine for us, not an event.",
  },
  {
    emoji: "📈",
    title: "A course, not a lesson",
    description:
      "Each course has a defined outcome. You finish knowing what you can ski, not just having had a few hours on snow. The twelve-day takes a complete beginner to confident parallel turns on intermediate terrain.",
  },
  ...EXTRA_HIGHLIGHTS,
].map((h, i) => ({ image: demo(i), ...h }));

const activities = [
  "Nursery slope sessions",
  "Gondola Phase 1 terrain",
  "Evening technique talks",
  "Snow safety briefing",
  ...EXTRA_ACTIVITIES,
].map((title, i) => ({ image: demo(i + 1), title }));

const itinerary = [
  {
    title: "Day 1 — Arrival & first session",
    description:
      "Airport pickup at Srinagar and the drive up through Tangmarg. Boot fitting, gear check, and your first half session on the nursery slope that afternoon — standing, sliding, and stopping.",
  },
  {
    title: "Day 2 — Stopping & the first turns",
    description:
      "A full day on the nursery slope. The snowplough stop becomes reliable, and by the afternoon you are making your first turns in both directions.",
  },
  {
    title: "Day 3 — Linking turns",
    description:
      "Turns joined together into a continuous run. This is the day most people stop thinking about their feet and start looking ahead.",
  },
  {
    title: "Day 4 — Full runs & the drag lift",
    description:
      "Longer runs using the drag lift, which is also the day you stop walking back up. 5-day students finish here with a departure morning session.",
  },
  {
    title: "Day 5 — Gondola Phase 1, Kongdoori",
    description:
      "Up the Gondola to Kongdoori and onto real mountain terrain for the first time. Wider, longer and more rewarding than the nursery slope.",
  },
  {
    title: "Day 6 — Control on steeper snow",
    description:
      "Speed control and turn shape on steeper pitches. 7-day students finish here with a departure morning session.",
  },
  {
    title: "Day 7 — Rest day",
    description:
      "A deliberate day off. Twelve consecutive ski days is too many for a body that has never skied — the rest day is why the second week is where real progress happens.",
  },
  {
    title: "Day 8 — Parallel turns begin",
    description:
      "The snowplough starts to disappear. Skis come together through the turn and your legs do less work.",
  },
  {
    title: "Day 9 — The chairlift & varied terrain",
    description:
      "Chairlift runs and your first properly varied snow. Different conditions in one day, which is what builds judgement.",
  },
  {
    title: "Day 10 — Parallel on intermediate runs",
    description:
      "Full intermediate runs, parallel throughout. This is the standard the twelve-day course exists to reach.",
  },
  {
    title: "Day 11 — Putting it together",
    description:
      "A full day skiing rather than learning — your coach follows rather than leads, correcting where it matters.",
  },
  {
    title: "Day 12 — Final session & departure",
    description: "A morning session, then down the mountain to Srinagar airport.",
  },
].map((d, i) => ({ ...d, image: demo(i) }));

// Three duration cards, two price rows each (3-sharing is the cheaper, main price).
const tiers = [
  {
    name: "5 Days",
    tag: "SHORT COURSE",
    desc: "4 ski days · 4 nights · for complete beginners",
    price: "₹27,999",
    priceLabel: "3-sharing",
    price2: "₹32,999",
    price2Label: "2-sharing",
    feats: [
      "Max 3 students per coach",
      "4 ski days including arrival and departure sessions",
      "4 nights' stay with all meals",
      "Ski, boots, poles and helmet",
      "Srinagar airport transfers both ways",
      "Daily transport to the slopes",
    ],
  },
  {
    name: "7 Days",
    tag: "MOST POPULAR",
    desc: "6 ski days · 6 nights · beginner to independent",
    price: "₹37,999",
    priceLabel: "3-sharing",
    price2: "₹42,999",
    price2Label: "2-sharing",
    feats: [
      "Max 3 students per coach",
      "6 ski days including arrival and departure sessions",
      "6 nights' stay with all meals",
      "Gondola Phase 1 terrain from day 5",
      "Ski, boots, poles and helmet",
      "Srinagar airport transfers and daily slope transport",
    ],
  },
  {
    name: "12 Days",
    tag: "COMPLETE COURSE",
    desc: "10 ski days · 11 nights · one rest day · to intermediate",
    price: "₹64,999",
    priceLabel: "3-sharing",
    price2: "₹74,999",
    price2Label: "2-sharing",
    feats: [
      "Max 3 students per coach",
      "10 ski days plus a planned rest day",
      "11 nights' stay with all meals",
      "Chairlift and intermediate terrain",
      "Ski, boots, poles and helmet",
      "Srinagar airport transfers and daily slope transport",
    ],
  },
];

const adventure = {
  slug: SLUG,
  name: "Gulmarg Ski Course",
  published: false,
  badge: "SKI SCHOOL",
  accent: "hsl(205 90% 50%)",
  accent2: "hsl(195 70% 45%)",
  particles: "snow",
  titleHtml: 'Learn to ski in <span class="grad-accent-text italic">Gulmarg</span>',
  sub: "Three students to a coach, never more. Five, seven and twelve-day courses on the Gulmarg slopes — coach, equipment, room, all meals and transfers in one price.",
  heroImage: IMG_SKIER,
  heroImageMobile: IMG_SKIER_MOBILE,
  finalImage: IMG_GONDOLA_WIDE,
  ogImage: IMG_SKIER,
  facts: j([
    "Max 3 per coach",
    "5 / 7 / 12 Day Courses",
    "Dec – Mar season",
    "Beginner to intermediate",
    "Gulmarg base",
  ]),
  heroCta: "See Course Options",
  navCta: "Request a Place",
  formCta: "Request a Place →",
  offerText: "❄️ Winter 2026–27 season open — December to March, rolling start dates",
  strip: j([
    "🎿 Max 3 Students Per Coach",
    "🏔️ Gulmarg Slopes",
    "🛏️ Stay & All Meals Included",
    "🚐 Airport Transfers Included",
    "❄️ Dec – Mar Season",
    "📍 Local Instructors",
  ]),
  stats: j([
    ["3", "students", "Maximum per coach"],
    ["10", "ski days", "On the 12-day course"],
    ["8,700", "ft", "Gulmarg base elevation"],
  ]),
  highlightsTitle: "Why Learn Here",
  highlights: j(highlights),
  activitiesTitle: "What Your Days Look Like",
  activities: j(activities),
  itineraryTitle: "How the Course Builds",
  itinerary: j(itinerary),
  tiers: j(tiers),
  pricingKicker: "COURSE OPTIONS",
  pricingTitle: "Pick your course length",
  paymentNote: "Pay 10% to confirm your place · balance on arrival",
  // Rolling start dates, not fixed departures — empty hides the Departures section + Event schema.
  batches: j([]),
  inclusions: j([
    "Certified ski instruction, maximum 3 students per coach, for every ski day of your course",
    "Half-day sessions on your arrival and departure days, subject to your travel timings",
    "Accommodation in Gulmarg on sharing basis, as per your chosen option",
    "All meals throughout your stay",
    "Full ski equipment — skis, boots, poles and helmet",
    "Srinagar airport pickup and drop",
    "Daily transport between your hotel and the slopes",
    "Chained vehicle on the Tangmarg–Gulmarg road when snow requires it",
    "Support from our Tangmarg-based team throughout",
  ]),
  exclusions: j([
    "Lift passes — bought on the day to match your level. Beginner drag lift is around ₹350 a day; a Gondola Phase 1 ski pass is ₹1,200–1,500 a day. Your coach tells you which you need each morning. We do not bundle them because a first-timer should not pay for a Gondola pass they will not use.",
    "Flights or train to and from Srinagar — we can arrange these and pass on the fare",
    "Ski clothing — jacket, trousers, gloves and goggles. Available to hire in Gulmarg if you would rather not buy",
    "Travel insurance, which we strongly recommend for any snow sport",
    "Personal expenses, shopping and tips",
    "Anything not listed under inclusions",
  ]),
  gallery: j([IMG_GONDOLA_WIDE, IMG_SKIER, IMG_GONDOLA_TALL, IMG_SKIER_MOBILE]),
  finalTitle: "Learn properly, not in a crowd",
  finalSub:
    "Three students to a coach, a defined outcome, and one price covering coach, equipment, room, meals and transfers.",
  finalCta: "Request a Place",
  finalNote:
    "Rolling start dates from December to March. Tell us your dates and we will confirm availability before you pay anything.",
  metaTitle: "Gulmarg Ski Course",
  metaDesc:
    "Learn to ski in Gulmarg with max 3 students per coach. Five, seven and twelve-day courses from ₹32,999 per person (twin sharing) — coach, gear, stay, meals and transfers included.",
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
  const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`select current_database() as db`;
  console.log(`Database: ${db}`);
  if (await prisma.adventure.findUnique({ where: { slug: SLUG }, select: { id: true } }))
    throw new Error("adventure slug already exists");
  const cat = await prisma.faqCategory.findUnique({ where: { slug: FAQ_CATEGORY_SLUG } });
  if (!cat) throw new Error("FAQ category missing");
  // FAQ slugs: same algorithm as generateFaqSlug, resolved up-front so the write is one atomic call
  const taken = new Set((await prisma.faq.findMany({ select: { slug: true } })).map((f) => f.slug));
  const faqRows = faqs.map((f, i) => {
    const base = slugify(f.question);
    let slug = base,
      n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;
    taken.add(slug);
    // DRAFT: published FAQs are listed on /faq and /faq/[slug] immediately; flip to PUBLISHED together with the adventure.
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
  if (adventure.published !== false) throw new Error("guard");

  console.log("INSERT PLAN (one nested prisma.adventure.create → one transaction)");
  console.log(
    ` Adventure: ${adventure.name} | slug ${SLUG} | published=${adventure.published} | ${highlights.length} highlights, ${activities.length} activities, ${itinerary.length} itinerary days, ${tiers.length} tiers (2 prices each), 0 batches`,
  );
  tiers.forEach((t) =>
    console.log(
      `   ${t.name}: ${t.priceLabel} ${t.price} / ${t.price2Label} ${t.price2} [${t.tag}]`,
    ),
  );
  console.log(
    ` Faq ×${faqRows.length} (category "${cat.name}", status DRAFT, shortAnswer = answer):`,
  );
  faqRows.forEach((f) => console.log(`   ${f.sortOrder}. ${f.slug}`));
  if (process.env.APPLY !== "1") return console.log("DRY RUN — nothing written.");
  const created = await prisma.adventure.create({
    data: { ...adventure, relatedFaqs: { create: faqRows } },
    select: { id: true, slug: true },
  });
  console.log(`CREATED adventure ${created.id} (${created.slug})`);
}
main().finally(() => prisma.$disconnect());
