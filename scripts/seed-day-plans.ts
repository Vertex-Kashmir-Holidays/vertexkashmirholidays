// One-off seed: the starter Destinations Library — ready-written Kashmir day
// headings + descriptions, 2–4 versions per common route, for the team to review and edit under
// CRM → Day Plans. Idempotent: a plan is only added when no plan with the same
// route + title exists, so re-running never duplicates or overwrites edits.
// Validated against dayPlanInputSchema before writing.
//
// Run: DATABASE_URL=<target> npx tsx scripts/seed-day-plans.ts
import { PrismaClient } from "@prisma/client";
import { dayPlanInputSchema, type DayPlanInput } from "../src/lib/dayPlans/schema";

const prisma = new PrismaClient();

type Season = DayPlanInput["season"];

function plan(
  fromPlace: string,
  toPlace: string,
  title: string,
  body: string,
  season: Season = "ALL_YEAR",
): DayPlanInput {
  return dayPlanInputSchema.parse({ fromPlace, toPlace, title, body, season });
}

const PLANS: DayPlanInput[] = [
  // ── Arrival in Srinagar ────────────────────────────────────────────────
  plan("Srinagar", "Srinagar", "Arrival in Srinagar — Welcome to Kashmir",
    "Arrive at Srinagar airport, where our representative welcomes you and transfers you to your hotel. After check-in and some rest, head out in the evening for a relaxing Shikara ride on Dal Lake, gliding past floating gardens, houseboats and the lake's little market stalls as the sun sets over the Zabarwan hills. Return to the hotel for dinner and an overnight stay."),
  plan("Srinagar", "Srinagar", "Arrival in Srinagar & Mughal Gardens",
    "Meet our representative at Srinagar airport and transfer to your hotel. After freshening up, visit the famous Mughal Gardens — Nishat Bagh with its terraced lawns facing Dal Lake, Shalimar Bagh built by Emperor Jahangir, and the spring-fed Chashme Shahi. If time allows, drive up to Pari Mahal for a sweeping view of the lake. Evening at leisure; dinner and overnight stay in Srinagar.", "SUMMER"),
  plan("Srinagar", "Srinagar", "Arrival in Srinagar — Houseboat Stay",
    "On arrival at Srinagar airport you are met and transferred to the ghat, where a Shikara takes you across to your houseboat on Dal Lake. Settle into the carved walnut-wood interiors, enjoy Kashmiri kahwa on the deck and watch lake life drift by. In the evening, a short Shikara ride around the lake. Dinner and overnight stay on the houseboat."),
  plan("Srinagar", "Srinagar", "Arrival in Snowy Srinagar",
    "Arrive at Srinagar airport and transfer to your hotel. Winter gives the city a quiet, magical feel — misty mornings, bare chinar trees and snow on the surrounding peaks. After check-in, warm up with a cup of kahwa and, weather permitting, take a short Shikara ride on Dal Lake in the afternoon. Evening at leisure in your heated room. Dinner and overnight stay in Srinagar.", "WINTER"),

  // ── Srinagar local ─────────────────────────────────────────────────────
  plan("Srinagar", "Srinagar", "Srinagar Local Sightseeing",
    "After breakfast, set out for a full day in Srinagar. Visit the Shankaracharya Temple on its hilltop for a panoramic view of the city, then the Mughal Gardens — Nishat Bagh, Shalimar Bagh and Chashme Shahi. In the afternoon visit the white marble Hazratbal Shrine on the banks of Dal Lake. End the day with a Shikara ride. Dinner and overnight stay in Srinagar."),
  plan("Srinagar", "Srinagar", "Old City Heritage Walk & Dal Lake",
    "After breakfast, explore the heritage of old Srinagar — the grand Jamia Masjid with its 370 wooden pillars, the riverside Khanqah-e-Moula (Shah-e-Hamadan) with its papier-mâché interiors, and the busy lanes of the old bazaars known for spices, copperware and pashmina. Later, relax on a Shikara ride and visit the lake's floating vegetable gardens. Dinner and overnight stay in Srinagar."),
  plan("Srinagar", "Srinagar", "Sunrise Floating Market & Tulip Garden",
    "An early start for a sunrise Shikara ride to the floating vegetable market on Dal Lake, where farmers trade produce from their boats. Return for breakfast, then visit the Indira Gandhi Memorial Tulip Garden — Asia's largest, in bloom from late March to April — followed by the Botanical Garden and Chashme Shahi. Afternoon free for shopping. Dinner and overnight stay in Srinagar.", "SUMMER"),
  plan("Srinagar", "Srinagar", "Srinagar in Winter — Lakes, Shrines & Markets",
    "After breakfast, visit the Shankaracharya Temple (road conditions permitting) for views of the snow-covered valley, then the Hazratbal Shrine and the Mughal Gardens in their quiet winter look. Warm up with a traditional Wazwan lunch (on own account) and shop for pashmina shawls, kangris and dry fruits at Lal Chowk. Dinner and overnight stay in Srinagar.", "WINTER"),

  // ── Srinagar → Gulmarg ─────────────────────────────────────────────────
  plan("Srinagar", "Gulmarg", "Day Excursion to Gulmarg — Meadow of Flowers",
    "After breakfast, drive about 2 hours (50 km) to Gulmarg through apple orchards and pine forests. Ride the Gulmarg Gondola — one of the highest cable cars in the world — to Kongdoori (Phase 1) and, weather permitting, Apharwat (Phase 2). Explore the meadows on pony or foot and visit the St. Mary's Church and the Maharani Temple. Return to Srinagar in the evening for dinner and overnight stay. (Gondola tickets and pony rides at own cost.)", "SUMMER"),
  plan("Srinagar", "Gulmarg", "Srinagar to Gulmarg — Overnight in the Mountains",
    "After breakfast, check out and drive to Gulmarg (about 2 hours). Check in to your hotel and spend the day exploring the meadows — take the Gondola to Kongdoori, enjoy a pony ride to Strawberry Valley or Khilanmarg, and stop at the Golf Course, one of the highest in the world. Evening walk under the stars. Dinner and overnight stay in Gulmarg.", "SUMMER"),
  plan("Srinagar", "Gulmarg", "Day Excursion to Snowy Gulmarg",
    "After breakfast, drive to Gulmarg (about 2–2.5 hours in winter; snow chains or a local vehicle may be needed near Tangmarg). Enjoy the snow — sledging, a snow-scooter or ATV ride, and the Gondola to Kongdoori and Apharwat for breathtaking white views (subject to weather). Return to Srinagar in the evening for dinner and overnight stay. (Snow activities, chain charges and Gondola tickets at own cost.)", "WINTER"),
  plan("Srinagar", "Gulmarg", "Srinagar to Gulmarg — Winter Wonderland Stay",
    "After breakfast, drive to Gulmarg, India's premier ski destination. Check in and step straight into the snow: try a beginner ski lesson, sledging or a snow-scooter ride, and take the Gondola up to Apharwat for powder-white views (weather permitting). Warm up by the fire in the evening. Dinner and overnight stay in Gulmarg. (Skiing, equipment and Gondola at own cost.)", "WINTER"),

  // ── Gulmarg local ──────────────────────────────────────────────────────
  plan("Gulmarg", "Gulmarg", "Gulmarg — Gondola & Alpine Meadows",
    "After breakfast, ride the Gondola up to Kongdoori and on to Apharwat Peak (Phase 2, about 4,000 m, weather permitting) for views of the Pir Panjal range and, on clear days, Nanga Parbat. Back in the meadows, take a pony ride to the Seven Springs or Alpather lake trail, or simply relax on the slopes. Dinner and overnight stay in Gulmarg.", "SUMMER"),
  plan("Gulmarg", "Gulmarg", "Gulmarg — A Full Day on the Snow",
    "A full day for the snow lover. Take a guided ski or snowboard lesson on the beginner slopes, then ride the Gondola to Apharwat for the famous powder runs (for experienced skiers) or simply for the view. In the afternoon, sledging and a snow-scooter ride. Hot kahwa and dinner by the fire. Overnight stay in Gulmarg.", "WINTER"),
  plan("Gulmarg", "Gulmarg", "Gulmarg — Khilanmarg Trek & Leisure",
    "After breakfast, take a gentle 6 km pony or walking trail up to Khilanmarg, a flower-carpeted meadow with stunning views of the Kashmir valley and the Pir Panjal peaks. Picnic in the meadows, return to Gulmarg in the afternoon and spend the evening at leisure. Dinner and overnight stay in Gulmarg.", "SUMMER"),

  // ── Gulmarg → Pahalgam / Srinagar ─────────────────────────────────────
  plan("Gulmarg", "Pahalgam", "Gulmarg to Pahalgam — Valley of Shepherds",
    "After breakfast, check out and drive to Pahalgam (about 4–5 hours) via Srinagar. En route, stop at the saffron fields of Pampore, the ancient Awantipora temple ruins and the cricket-bat workshops of Sangam. Arrive in Pahalgam by evening and check in. Evening walk along the Lidder River. Dinner and overnight stay in Pahalgam."),
  plan("Gulmarg", "Pahalgam", "Gulmarg to Pahalgam via Srinagar Gardens",
    "Check out after breakfast and drive towards Srinagar, stopping for lunch (own account) and a quick visit to a Mughal Garden. Continue to Pahalgam along the Lidder valley, with apple orchards and pine forests lining the road. Check in to your hotel by evening. Dinner and overnight stay in Pahalgam."),
  plan("Gulmarg", "Srinagar", "Gulmarg to Srinagar — Houseboat Evening",
    "After breakfast, enjoy a last morning in the Gulmarg meadows, then drive back to Srinagar (about 2 hours). Check in to a houseboat on Dal or Nigeen Lake and spend the evening on a Shikara ride, visiting the floating gardens and lake-side handicraft shops. Dinner and overnight stay on the houseboat."),
  plan("Gulmarg", "Srinagar", "Gulmarg to Srinagar & Local Shopping",
    "After breakfast, check out and drive back to Srinagar. After check-in, visit Lal Chowk and Polo View market to shop for pashmina, Kashmiri carpets, papier-mâché, walnut-wood crafts, saffron and dry fruits. Evening at leisure. Dinner and overnight stay in Srinagar."),

  // ── Srinagar → Pahalgam ────────────────────────────────────────────────
  plan("Srinagar", "Pahalgam", "Srinagar to Pahalgam — Saffron Fields & Lidder Valley",
    "After breakfast, drive to Pahalgam (about 2.5–3 hours, 95 km). On the way, stop at the saffron fields of Pampore, the 9th-century Awantipora temple ruins and the cricket-bat factories of Sangam. Arrive in Pahalgam, check in and stroll along the Lidder River in the evening. Dinner and overnight stay in Pahalgam."),
  plan("Srinagar", "Pahalgam", "Day Excursion to Pahalgam",
    "After breakfast, drive to Pahalgam through the scenic Lidder valley. Explore Betaab Valley, Aru Valley and Chandanwari by local union taxi (at own cost) — meadows, pine forests and the rushing Lidder River. Optional pony ride to Baisaran, the 'Mini Switzerland'. Return to Srinagar in the evening for dinner and overnight stay."),
  plan("Srinagar", "Pahalgam", "Srinagar to Pahalgam in Winter",
    "After breakfast, drive to Pahalgam (road conditions permitting). The valley turns into a snow-covered wonderland in winter — frozen streams, white pine forests and quiet villages. Check in and enjoy a walk in the snow along the Lidder. Dinner and overnight stay in Pahalgam.", "WINTER"),

  // ── Pahalgam local ─────────────────────────────────────────────────────
  plan("Pahalgam", "Pahalgam", "Pahalgam Local — Aru, Betaab & Chandanwari",
    "After breakfast, explore Pahalgam's famous valleys by local union taxi (at own cost): Aru Valley with its meadows and mountain views, Betaab Valley named after the Bollywood film, and Chandanwari, the starting point of the Amarnath Yatra, where snow often lingers into summer. Return to the hotel in the evening. Dinner and overnight stay in Pahalgam."),
  plan("Pahalgam", "Pahalgam", "Pahalgam — Baisaran Meadows by Pony",
    "After breakfast, take a pony ride (at own cost) up to Baisaran, the pine-ringed meadow known as 'Mini Switzerland', and on to Kashmir Valley point and the Dabyan viewpoint. In the afternoon, relax by the Lidder River or try trout fishing (permit required). Dinner and overnight stay in Pahalgam.", "SUMMER"),
  plan("Pahalgam", "Pahalgam", "Pahalgam — Snow Day in the Valley",
    "After breakfast, head out to enjoy Pahalgam's winter snow — sledging, snow walks and photography in the white pine forests. Visit Betaab Valley where accessible (union taxi at own cost, subject to road conditions). Warm up with kahwa in the afternoon. Dinner and overnight stay in Pahalgam.", "WINTER"),
  plan("Pahalgam", "Pahalgam", "Pahalgam — Aru Valley Nature Walk",
    "After breakfast, drive to Aru Valley (union taxi at own cost) for a gentle guided nature walk through meadows dotted with shepherd huts, with views of the Kolahoi range. Picnic lunch by the stream (own account), then return to Pahalgam for an evening at the Lidder riverside. Dinner and overnight stay in Pahalgam.", "SUMMER"),

  // ── Pahalgam → Srinagar ────────────────────────────────────────────────
  plan("Pahalgam", "Srinagar", "Pahalgam to Srinagar — Shikara Evening",
    "After breakfast, check out and drive back to Srinagar (about 3 hours). After check-in, enjoy a sunset Shikara ride on Dal Lake, visiting the floating gardens and Char Chinar island. Dinner and overnight stay in Srinagar."),
  plan("Pahalgam", "Srinagar", "Pahalgam to Srinagar & Mughal Gardens",
    "Check out after breakfast and drive to Srinagar. In the afternoon visit the Mughal Gardens — Nishat Bagh, Shalimar Bagh and Chashme Shahi — and the Hazratbal Shrine. Evening free for shopping. Dinner and overnight stay in Srinagar."),

  // ── Srinagar → Sonamarg ────────────────────────────────────────────────
  plan("Srinagar", "Sonamarg", "Day Excursion to Sonamarg — Meadow of Gold",
    "After breakfast, drive to Sonamarg (about 2.5–3 hours, 80 km) along the Sindh river. Take a pony ride or local taxi (at own cost) to the Thajiwas Glacier, where snow lingers through summer, and enjoy the dramatic mountain scenery. Return to Srinagar in the evening for dinner and overnight stay.", "SUMMER"),
  plan("Srinagar", "Sonamarg", "Srinagar to Sonamarg — Overnight by the Glacier",
    "After breakfast, check out and drive to Sonamarg. Check in and spend the afternoon at Thajiwas Glacier (pony at own cost) or along the Sindh river. Enjoy the quiet mountain evening under the stars. Dinner and overnight stay in Sonamarg.", "SUMMER"),
  plan("Srinagar", "Sonamarg", "Snow Day at Sonamarg",
    "After breakfast, drive towards Sonamarg for a day in the snow (access in winter depends on road and weather conditions). Enjoy snow play, sledging and photography in the white landscape. Return to Srinagar in the evening. Dinner and overnight stay in Srinagar.", "WINTER"),
  plan("Sonamarg", "Sonamarg", "Sonamarg — Glacier & Meadows",
    "After breakfast, visit the Thajiwas Glacier by pony (at own cost) and, if you're up for it, the trail towards Zojila viewpoint (subject to permits and road conditions). Afternoon at leisure along the Sindh river. Dinner and overnight stay in Sonamarg.", "SUMMER"),
  plan("Sonamarg", "Srinagar", "Sonamarg to Srinagar",
    "After a relaxed breakfast with mountain views, check out and drive back to Srinagar. Check in and spend the evening on a Shikara ride or shopping for Kashmiri handicrafts. Dinner and overnight stay in Srinagar.", "SUMMER"),

  // ── Srinagar → Doodhpathri / Yusmarg ───────────────────────────────────
  plan("Srinagar", "Doodhpathri", "Day Excursion to Doodhpathri — Valley of Milk",
    "After breakfast, drive about 2 hours (42 km) to Doodhpathri, a lesser-known meadow named for its milky-white streams. Walk across the rolling meadows, cross the Shaliganga stream and enjoy a pony ride (at own cost) amid pine forests, far from the crowds. Return to Srinagar in the evening for dinner and overnight stay.", "SUMMER"),
  plan("Srinagar", "Doodhpathri", "Doodhpathri in Snow",
    "After breakfast, drive to Doodhpathri (road conditions permitting) to enjoy its snow-covered meadows and pine forests in their winter silence — perfect for snow walks and photography. Return to Srinagar by evening. Dinner and overnight stay in Srinagar.", "WINTER"),
  plan("Srinagar", "Yusmarg", "Day Excursion to Yusmarg",
    "After breakfast, drive about 2 hours (47 km) to Yusmarg, a peaceful meadow ringed by pine and fir forests. Take a pony ride (at own cost) to Nilnag lake or the Doodh Ganga river, and enjoy a quiet picnic far from the busier spots. Return to Srinagar in the evening for dinner and overnight stay.", "SUMMER"),
  plan("Srinagar", "Yusmarg", "Yusmarg & Charar-e-Sharief",
    "After breakfast, drive towards Yusmarg, stopping at the revered Charar-e-Sharief shrine of Sheikh Noor-ud-Din. Continue to the Yusmarg meadows for a walk or pony ride (at own cost) amid the forests. Return to Srinagar by evening. Dinner and overnight stay in Srinagar."),

  // ── Gurez ──────────────────────────────────────────────────────────────
  plan("Srinagar", "Gurez", "Srinagar to Gurez — Over the Razdan Pass",
    "After breakfast, set off on a long, spectacular drive (about 6–7 hours) to the remote Gurez valley via Bandipora and the Razdan Pass (about 3,300 m). Descend into the valley along the Kishanganga river, with the pyramid-shaped Habba Khatoon peak watching over it. Check in at Dawar. Dinner and overnight stay in Gurez. (Permit required; open roughly May–November.)", "SUMMER"),
  plan("Srinagar", "Gurez", "Srinagar to Gurez via Wular Lake",
    "After breakfast, drive towards Bandipora, stopping at Wular Lake, one of Asia's largest freshwater lakes. Continue over the Razdan Pass into the Gurez valley, arriving by late afternoon. Evening walk in Dawar village. Dinner and overnight stay in Gurez. (Permit required; open roughly May–November.)", "SUMMER"),
  plan("Gurez", "Gurez", "Gurez Valley — Villages & Kishanganga",
    "After breakfast, explore the Gurez valley — the traditional log-wood houses of the Dard-Shina villages, the Habba Khatoon spring and peak, and the Kishanganga river. Drive towards Tulail valley if time and permits allow. Dinner and overnight stay in Gurez.", "SUMMER"),
  plan("Gurez", "Srinagar", "Gurez to Srinagar",
    "After breakfast, check out and drive back to Srinagar over the Razdan Pass, enjoying the views one last time. Arrive in Srinagar by evening and check in. Dinner and overnight stay in Srinagar.", "SUMMER"),

  // ── Jammu ⇄ Srinagar ───────────────────────────────────────────────────
  plan("Jammu", "Srinagar", "Jammu to Srinagar by Road",
    "Our driver picks you up from Jammu railway station or airport for the drive to Srinagar (about 7–8 hours) via Udhampur, Ramban and the Navyug (Banihal) tunnel, with views of the Chenab river along the way. Arrive in Srinagar by evening and check in. Dinner and overnight stay in Srinagar."),
  plan("Jammu", "Srinagar", "Jammu to Srinagar via Patnitop",
    "Pick-up from Jammu and drive towards Srinagar, stopping at the hill station of Patnitop for its pine forests and views (or a short break at Kud). Continue through the Banihal tunnel into the Kashmir valley, arriving in Srinagar by evening. Dinner and overnight stay in Srinagar."),

  // ── Departure ──────────────────────────────────────────────────────────
  plan("Srinagar", "Srinagar", "Departure from Srinagar",
    "After breakfast, check out and transfer to Srinagar airport for your onward journey, carrying beautiful memories of Kashmir. Please reach the airport at least 2.5 hours before your flight, as security checks here take longer."),
  plan("Srinagar", "Srinagar", "Departure — Last-minute Shopping & Airport",
    "After breakfast and check-out, spend the morning picking up souvenirs — saffron, dry fruits, kahwa and pashmina — before your transfer to Srinagar airport. Please reach the airport at least 2.5 hours before your flight."),
  plan("Srinagar", "Jammu", "Departure — Srinagar to Jammu",
    "After breakfast, check out and drive to Jammu (about 7–8 hours) for your onward train or flight. Our driver drops you at Jammu railway station or airport. Please plan your onward departure for the evening, as road travel times can vary."),
];

async function main() {
  const existing = await prisma.dayPlan.findMany({ select: { fromPlace: true, toPlace: true, title: true } });
  const key = (p: { fromPlace: string; toPlace: string; title: string }) =>
    `${p.fromPlace.toLowerCase()}|${p.toPlace.toLowerCase()}|${p.title.toLowerCase()}`;
  const have = new Set(existing.map(key));
  const fresh = PLANS.map((p, i) => ({ ...p, sortOrder: i })).filter((p) => !have.has(key(p)));
  if (fresh.length) await prisma.dayPlan.createMany({ data: fresh });
  console.log(`Day plans: ${fresh.length} added, ${PLANS.length - fresh.length} already present.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
