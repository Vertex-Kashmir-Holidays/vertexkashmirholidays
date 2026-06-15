import { PrismaClient, Role, TourCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@vertex.com" },
    update: {},
    create: {
      email: "admin@vertex.com",
      name: "Admin",
      passwordHash: await bcrypt.hash("admin123", 12),
      role: Role.ADMIN,
    },
  });
  console.log("✓ Admin user");

  // ── Destinations ────────────────────────────────────────────────────────────
  const gulmarg = await prisma.destination.upsert({
    where: { slug: "gulmarg" },
    update: { tagline: "Meadow of flowers · Skiing", isFeatured: true, sortOrder: 0 },
    create: {
      name: "Gulmarg",
      slug: "gulmarg",
      tagline: "Meadow of flowers · Skiing",
      isFeatured: true,
      sortOrder: 0,
      excerpt: "The Meadow of Flowers — Asia's premier ski resort and summer alpine paradise.",
      description:
        "Perched at 2,650 m in the Pir Panjal range, Gulmarg is Kashmir's crown jewel. In winter it transforms into a world-class ski destination with the world's second-highest cable car; in summer it's a rolling carpet of wildflowers. Famous for the Gulmarg Gondola, golf at the world's highest course, and breathtaking Himalayan vistas.",
      coverImage: "https://picsum.photos/seed/gulmarg/1600/900",
      location: "Baramulla District, Jammu & Kashmir, 2650 m",
      metaTitle: "Gulmarg — Meadow of Flowers | Vertex Kashmir Holidays",
      metaDesc:
        "Explore Gulmarg — Asia's highest ski resort, the iconic Gondola, and sweeping meadows of wildflowers. Book your Gulmarg tour with Vertex Kashmir Holidays.",
      ogImage: "https://picsum.photos/seed/gulmarg/1200/630",
    },
  });

  const pahalgam = await prisma.destination.upsert({
    where: { slug: "pahalgam" },
    update: { tagline: "Lidder valley", isFeatured: true, sortOrder: 1 },
    create: {
      name: "Pahalgam",
      slug: "pahalgam",
      tagline: "Lidder valley",
      isFeatured: true,
      sortOrder: 1,
      excerpt: "The Valley of Shepherds — lush meadows, roaring rivers, and pine forests.",
      description:
        "Nestled at 2,130 m where the Lidder river meets rolling meadows, Pahalgam is one of Kashmir's most scenic valleys. It serves as the base camp for the annual Amarnath Yatra and is celebrated for Betaab Valley, Aru Valley, Baisaran meadow, and trout fishing in the crystal-clear Lidder. A favourite for honeymoon couples and trekkers alike.",
      coverImage: "https://picsum.photos/seed/pahalgam/1600/900",
      location: "Anantnag District, Jammu & Kashmir, 2130 m",
      metaTitle: "Pahalgam — Valley of Shepherds | Vertex Kashmir Holidays",
      metaDesc:
        "Discover Pahalgam's emerald meadows, Betaab Valley, and the Lidder river. Perfect for honeymooners and adventure seekers. Book with Vertex Kashmir Holidays.",
      ogImage: "https://picsum.photos/seed/pahalgam/1200/630",
    },
  });

  const srinagar = await prisma.destination.upsert({
    where: { slug: "srinagar" },
    update: { tagline: "Dal Lake · Houseboats · Shikaras", isFeatured: true, sortOrder: 3 },
    create: {
      name: "Srinagar",
      slug: "srinagar",
      tagline: "Dal Lake · Houseboats · Shikaras",
      isFeatured: true,
      sortOrder: 3,
      excerpt: "The Summer Capital — Dal Lake, Mughal gardens, and floating markets.",
      description:
        "Srinagar, the summer capital of Jammu & Kashmir, is the soul of Kashmir. Dal Lake with its ornate houseboats, shikara rides, and floating vegetable markets is iconic worldwide. The city is also home to the 9th-century Shankaracharya temple, the fragrant Mughal gardens of Shalimar Bagh and Nishat Bagh, and the vibrant bazaars of Lal Chowk.",
      coverImage: "https://picsum.photos/seed/srinagar/1600/900",
      location: "Srinagar District, Jammu & Kashmir, 1585 m",
      metaTitle: "Srinagar — Dal Lake & Mughal Gardens | Vertex Kashmir Holidays",
      metaDesc:
        "Experience Srinagar's Dal Lake houseboats, shikara rides, Mughal gardens, and old city bazaars. Book your Srinagar package with Vertex Kashmir Holidays.",
      ogImage: "https://picsum.photos/seed/srinagar/1200/630",
    },
  });

  const sonmarg = await prisma.destination.upsert({
    where: { slug: "sonmarg" },
    update: { tagline: "Meadow of gold", isFeatured: true, sortOrder: 2 },
    create: {
      name: "Sonmarg",
      slug: "sonmarg",
      tagline: "Meadow of gold",
      isFeatured: true,
      sortOrder: 2,
      excerpt: "The Meadow of Gold — gateway to glaciers and high-altitude treks.",
      description:
        "Sonmarg — literally 'meadow of gold' — sits at 2,800 m along the Sindh river and marks the entry point of the Himalayan high-altitude terrain. It is the base for the spectacular Thajiwas Glacier, the Krishnasar and Vishansar alpine lakes trek, and serves as the last major stop before Zoji La pass on the Srinagar–Leh highway. Stunning river vistas and snow-capped peaks make it unforgettable.",
      coverImage: "https://picsum.photos/seed/sonmarg/1600/900",
      location: "Ganderbal District, Jammu & Kashmir, 2800 m",
      metaTitle: "Sonmarg — Meadow of Gold | Vertex Kashmir Holidays",
      metaDesc:
        "Explore Sonmarg's Thajiwas Glacier, alpine lakes, and dramatic river valley. Book your Sonmarg adventure with Vertex Kashmir Holidays.",
      ogImage: "https://picsum.photos/seed/sonmarg/1200/630",
    },
  });
  await prisma.destination.upsert({
    where: { slug: "doodhpathri" },
    update: { tagline: "Valley of milk", isFeatured: true, sortOrder: 4 },
    create: {
      name: "Doodhpathri",
      slug: "doodhpathri",
      tagline: "Valley of milk",
      isFeatured: true,
      sortOrder: 4,
      excerpt: "The Valley of Milk — pristine meadows, milky-white streams, and total serenity.",
      description:
        "Doodhpathri — literally 'valley of milk' — is named after its frothing white streams that tumble over smooth stones. At 2,730 m in the Budgam district, this undeveloped meadow is a riot of wildflowers in spring and remains one of Kashmir's best-kept secrets. No shops, no hotels — just waterfalls, pine fringes, and shepherds grazing their flocks.",
      coverImage: "https://picsum.photos/seed/doodhpathri/1600/900",
      location: "Budgam District, Jammu & Kashmir, 2730 m",
      metaTitle: "Doodhpathri — Valley of Milk | Vertex Kashmir Holidays",
      metaDesc:
        "Discover Doodhpathri — Kashmir's hidden valley of milky streams and untouched meadows. Day trips from Srinagar with Vertex Kashmir Holidays.",
      ogImage: "https://picsum.photos/seed/doodhpathri/1200/630",
    },
  });
  console.log("✓ Destinations");

  // ── Tours ───────────────────────────────────────────────────────────────────
  const tour1Details = {
    tagline: "A romantic escape through the paradise on earth ❤️",
    highlights: JSON.stringify([
      "❤️ Romantic Houseboat",
      "🛶 Sunset Shikara Ride",
      "🚠 Gulmarg Gondola",
      "🌸 Betaab Valley",
      "🍽️ Candlelight Dinner",
    ]),
    faqs: JSON.stringify([
      { question: "Is this package customisable?", answer: "Yes — every itinerary is handcrafted. Add days, upgrade hotels, or swap activities and your quote updates transparently." },
      { question: "What is the advance payment?", answer: "Just 20% to lock your dates. The balance is payable 7 days before the trip starts, securely via Razorpay." },
      { question: "Is the Gulmarg Gondola included?", answer: "Yes — both Phase 1 (Kongdori) and Phase 2 (Apharwat Peak) Gondola tickets are included in this package." },
      { question: "What is the cancellation policy?", answer: "Free cancellation up to 15 days before departure. Between 7–15 days, the 20% advance is held as credit for 12 months." },
    ]),
    startCity: "Srinagar",
    transport: "Private Cab",
    difficulty: "Easy",
    bestTime: "Apr – Oct",
    tourType: "Private Tour",
    pickupDrop: "Srinagar Airport",
    happyCount: 12000,
  };
  const tour1 = await prisma.tour.upsert({
    where: { slug: "honeymoon-in-heaven" },
    update: { badge: "BESTSELLER", badgeColor: "orange", ...tour1Details },
    create: {
      ...tour1Details,
      title: "Honeymoon in Heaven",
      slug: "honeymoon-in-heaven",
      badge: "BESTSELLER",
      badgeColor: "orange",
      category: TourCategory.HONEYMOON,
      duration: 7,
      excerpt: "Float on Dal Lake, ride through Gulmarg's golden meadows, and lose yourselves in Pahalgam's pine-scented valleys on the ultimate Kashmir honeymoon.",
      description:
        "Seven days crafted entirely for two. Begin with a luxurious houseboat stay on Dal Lake with candlelit shikara evenings, then ascend to the alpine romance of Gulmarg where the world's highest gondola lifts you above the clouds. Finish in the pastoral beauty of Pahalgam's Betaab Valley. Private transfers, premium accommodation, and curated experiences throughout.",
      coverImage: "https://picsum.photos/seed/honeymoon-kashmir/1600/900",
      gallery: JSON.stringify([
        "https://picsum.photos/seed/honeymoon-1/1600/900",
        "https://picsum.photos/seed/honeymoon-2/1600/900",
        "https://picsum.photos/seed/honeymoon-3/1600/900",
        "https://picsum.photos/seed/honeymoon-4/1600/900",
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Srinagar — Dal Lake", description: "Arrive at Srinagar airport, transfer to your deluxe houseboat on Dal Lake. Evening shikara ride through the floating market channels. Welcome dinner on deck under the stars." },
        { day: 2, title: "Srinagar — Mughal Gardens & Old City", description: "Morning at Nishat Bagh and Shalimar Bagh (Mughal gardens). Afternoon stroll through Lal Chowk bazaar and the old wooden mosques. Sunset from the Pari Mahal overlooking Dal." },
        { day: 3, title: "Srinagar to Pahalgam", description: "Scenic 3-hour drive through the Sindh valley and saffron fields of Pampore. Check in to your riverside resort. Afternoon walk along the Lidder river." },
        { day: 4, title: "Pahalgam — Betaab Valley & Aru", description: "Full day excursion to Betaab Valley (Bollywood's favourite backdrop) and Aru Valley. Pony rides through pine forests, picnic lunch by alpine streams." },
        { day: 5, title: "Pahalgam to Gulmarg", description: "Drive through the Pir Panjal foothills to Gulmarg (approx 3 hrs). Check in to a mountain-view resort. Evening stroll through the meadows — wildflowers in bloom." },
        { day: 6, title: "Gulmarg — Gondola & Alpine Meadows", description: "Gondola ride to Kongdori (Phase 1) and Apharwat peak (Phase 2, 4,200 m) for panoramic Himalayan views. Afternoon horse ride through Gulmarg's famous golf course meadow." },
        { day: 7, title: "Return to Srinagar & Departure", description: "Leisurely morning in Gulmarg. Drive back to Srinagar for last-minute shopping at the handicraft emporiums. Transfer to airport for onward journey with a heart full of Kashmir." },
      ]),
      inclusions: JSON.stringify([
        "6 nights accommodation (2 nights deluxe houseboat + 2 nights riverside resort + 2 nights mountain resort)",
        "Daily breakfast and dinner (MAP)",
        "All transfers in private air-conditioned vehicle",
        "Gondola tickets (Phase 1 & 2) in Gulmarg",
        "Shikara ride on Dal Lake",
        "Pony ride in Pahalgam",
        "Welcome bouquet and cake on arrival",
        "All applicable taxes and hotel service charges",
      ]),
      exclusions: JSON.stringify([
        "Airfare to/from Srinagar",
        "Personal expenses and tips",
        "Adventure activities not listed in inclusions",
        "Travel insurance",
        "Anything not mentioned under inclusions",
      ]),
      priceFrom: 45000,
      priceWas: 52000,
      discountPct: 13,
      bestseller: true,
      rating: 4.8,
      reviewCount: 2,
      published: true,
      metaTitle: "Honeymoon in Heaven — 7-Day Kashmir Package | Vertex Kashmir Holidays",
      metaDesc: "7-day Kashmir honeymoon: Dal Lake houseboat, Gulmarg Gondola, Pahalgam meadows. Starting ₹45,000/couple. Book your dream Kashmir honeymoon today.",
      ogImage: "https://picsum.photos/seed/honeymoon-kashmir/1200/630",
    },
  });

  const tour2Details = {
    tagline: "A wholesome Kashmir adventure for the whole family 👨‍👩‍👧",
    highlights: JSON.stringify([
      "🛶 Floating Market Shikara",
      "❄️ Sonmarg Glacier",
      "🚠 Gulmarg Gondola",
      "🐴 Pony Rides",
      "🏡 Houseboat Stay",
    ]),
    faqs: JSON.stringify([
      { question: "Is this package suitable for young children?", answer: "Absolutely — the itinerary is gently paced with family suites, and our drivers carry child-friendly extras. We tailor activities to your kids' ages." },
      { question: "What is the advance payment?", answer: "Just 20% to lock your dates. The balance is payable 7 days before the trip starts, securely via Razorpay." },
      { question: "Is the Gondola included?", answer: "Gondola Phase 1 (Kongdori) tickets are included for every family member. Phase 2 to Apharwat is an optional add-on." },
      { question: "What is the cancellation policy?", answer: "Free cancellation up to 15 days before departure. Between 7–15 days, the 20% advance is held as credit for 12 months." },
    ]),
    startCity: "Srinagar",
    transport: "Spacious SUV",
    difficulty: "Easy",
    bestTime: "Mar – Oct",
    tourType: "Private Tour",
    pickupDrop: "Srinagar Airport",
    happyCount: 8000,
  };
  const tour2 = await prisma.tour.upsert({
    where: { slug: "family-kashmir-explorer" },
    update: { badge: "POPULAR", badgeColor: "blue", ...tour2Details },
    create: {
      ...tour2Details,
      title: "Family Kashmir Explorer",
      slug: "family-kashmir-explorer",
      badge: "POPULAR",
      badgeColor: "blue",
      category: TourCategory.FAMILY,
      duration: 6,
      excerpt: "From shikara rides on Dal Lake to snowball fights in Gulmarg — a wholesome Kashmir adventure the whole family will treasure forever.",
      description:
        "Six days designed for families with children of all ages. Stay on a traditional houseboat, ride the world-famous Gondola, explore Pahalgam's meadows on pony-back, and create memories that will last a lifetime. Child-friendly activities, paced itinerary, and family suites throughout.",
      coverImage: "https://picsum.photos/seed/family-kashmir/1600/900",
      gallery: JSON.stringify([
        "https://picsum.photos/seed/family-1/1600/900",
        "https://picsum.photos/seed/family-2/1600/900",
        "https://picsum.photos/seed/family-3/1600/900",
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival & Dal Lake", description: "Land in Srinagar, transfer to your family houseboat. Kids love the floating market shikara ride — spotting vegetables and flowers being sold from small boats." },
        { day: 2, title: "Srinagar City & Mughal Gardens", description: "Explore Nishat Bagh and Shalimar Bagh — the kids can run through the terraced lawns. Visit Shankaracharya hill for panoramic city views. Evening at the handicraft market." },
        { day: 3, title: "Day Trip to Sonmarg", description: "Drive to Sonmarg (2 hrs) for a family pony or sledge ride to the Thajiwas Glacier. Snowball fights even in summer! Picnic lunch at the glacier base. Return to Srinagar." },
        { day: 4, title: "Srinagar to Pahalgam", description: "Drive to Pahalgam via the Saffron fields of Pampore. Settle into a family resort along the Lidder river. Gentle nature walk with the family in the evening." },
        { day: 5, title: "Pahalgam to Gulmarg", description: "Early drive to Gulmarg. Full day here: Gondola to Kongdori for snow (even in summer), pony rides through the meadow, and a round of mini-golf at the world's highest golf course." },
        { day: 6, title: "Gulmarg to Srinagar & Departure", description: "Morning walk in Gulmarg. Drive back to Srinagar, stop for local saffron and handicraft shopping. Transfer to airport." },
      ]),
      inclusions: JSON.stringify([
        "5 nights accommodation (2 houseboat + 1 resort Pahalgam + 2 resort Gulmarg)",
        "Daily breakfast and dinner",
        "All transfers in spacious SUV",
        "Gondola tickets (Phase 1) for all family members",
        "Shikara ride on Dal Lake",
        "Pony rides in Pahalgam and Gulmarg",
        "Glacier excursion in Sonmarg",
        "All taxes and service charges",
      ]),
      exclusions: JSON.stringify([
        "Airfare",
        "Gondola Phase 2 tickets",
        "Personal expenses",
        "Travel insurance",
        "Anything not mentioned under inclusions",
      ]),
      priceFrom: 32000,
      priceWas: 38000,
      discountPct: 16,
      bestseller: true,
      rating: 4.7,
      reviewCount: 2,
      published: true,
      metaTitle: "Family Kashmir Explorer — 6-Day Kashmir Family Package | Vertex Kashmir Holidays",
      metaDesc: "6-day family Kashmir tour: Dal Lake houseboat, Sonmarg glacier, Gulmarg Gondola, Pahalgam pony rides. Starting ₹32,000/family. Book now.",
      ogImage: "https://picsum.photos/seed/family-kashmir/1200/630",
    },
  });

  const tour3Details = {
    tagline: "Kashmir's ultimate Himalayan adventure circuit 🏔️",
    highlights: JSON.stringify([
      "🏔️ Alpine Lake Treks",
      "⛺ Wilderness Camping",
      "🚠 Apharwat Summit",
      "🚵 Mountain Biking",
      "🧗 Certified Guides",
    ]),
    faqs: JSON.stringify([
      { question: "How fit do I need to be?", answer: "You should be comfortable walking 5–6 hours a day at altitude. We share a preparation guide on booking and our guides set a steady, safe pace." },
      { question: "Is camping equipment provided?", answer: "Yes — tents, sleeping bags and mats are included on all trek days. You only bring personal trekking gear and clothing." },
      { question: "Are the treks guided?", answer: "Every trekking day is led by a certified local mountain guide, with a first-aid kit and emergency support throughout." },
      { question: "What is the cancellation policy?", answer: "Free cancellation up to 15 days before departure. Between 7–15 days, the 20% advance is held as credit for 12 months." },
    ]),
    startCity: "Srinagar",
    transport: "Private Vehicle",
    difficulty: "Challenging",
    bestTime: "Jun – Sep",
    tourType: "Guided Trek",
    pickupDrop: "Srinagar Airport",
    happyCount: 3500,
  };
  const tour3 = await prisma.tour.upsert({
    where: { slug: "high-altitude-adventure" },
    update: { badge: "TRENDING", badgeColor: "green", ...tour3Details },
    create: {
      ...tour3Details,
      title: "High Altitude Adventure",
      slug: "high-altitude-adventure",
      badge: "TRENDING",
      badgeColor: "green",
      category: TourCategory.ADVENTURE,
      duration: 8,
      excerpt: "Trek across the Krishnasar and Vishansar lakes, conquer Apharwat peak in Gulmarg, and cross the legendary Zoji La pass on Kashmir's ultimate adventure circuit.",
      description:
        "Eight days for those who want to push beyond the postcard. From the Sonmarg glacier approaches and Zoji La to the alpine lake treks of Pahalgam and the 4,200 m summit of Apharwat in Gulmarg — this itinerary packages the best of Himalayan adventure into one cohesive journey. All activities are guided by certified local mountain guides.",
      coverImage: "https://picsum.photos/seed/adventure-kashmir/1600/900",
      gallery: JSON.stringify([
        "https://picsum.photos/seed/adventure-1/1600/900",
        "https://picsum.photos/seed/adventure-2/1600/900",
        "https://picsum.photos/seed/adventure-3/1600/900",
        "https://picsum.photos/seed/adventure-4/1600/900",
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Srinagar", description: "Arrive Srinagar, acclimatisation walk around Dal Lake. Equipment check and briefing with lead guide. Stay: budget guesthouse near Dal." },
        { day: 2, title: "Srinagar to Sonmarg", description: "Drive to Sonmarg (2 hrs). Trek to Thajiwas Glacier base (5 km round trip, 3 hrs). Evening at campsite." },
        { day: 3, title: "Sonmarg — Nichnai Trek", description: "Full-day trek via Nichnai pass (4,100 m). High-altitude meadows and views of Zoji La. Camp overnight at Nichnai." },
        { day: 4, title: "Nichnai to Vishansar Lake", description: "Trek to the stunning Vishansar Lake (3,710 m). Surrounded by moraines and snow-fed streams. Camp at the lake shore." },
        { day: 5, title: "Vishansar to Krishnasar Lake", description: "Trek to twin Krishnasar Lake (3,800 m), one of the highest freshwater lakes in Kashmir. Return to Sonmarg via jeep track. Overnight Sonmarg." },
        { day: 6, title: "Sonmarg to Gulmarg", description: "Drive to Gulmarg (3 hrs). Afternoon MTB ride through the meadows. Overnight mountain lodge." },
        { day: 7, title: "Gulmarg — Apharwat Summit & Skiing", description: "Gondola to Apharwat (4,200 m). Summit hike with guide. Optional off-piste skiing with instructor. Full-day adventure on the snow." },
        { day: 8, title: "Gulmarg to Srinagar & Departure", description: "Morning yoga at meadow. Drive to Srinagar. Transfer to airport." },
      ]),
      inclusions: JSON.stringify([
        "7 nights accommodation (mix of guesthouses and mountain campsites)",
        "All meals during trek days (breakfast, packed lunch, dinner)",
        "Certified mountain guide for all treks",
        "Camping equipment (tent, sleeping bag)",
        "Gondola tickets in Gulmarg",
        "MTB hire in Gulmarg",
        "All transfers",
        "First-aid kit and emergency support",
        "All taxes",
      ]),
      exclusions: JSON.stringify([
        "Airfare",
        "Skiing equipment rental (optional extra)",
        "Personal trekking gear",
        "Travel/adventure insurance (strongly recommended)",
        "Personal expenses",
      ]),
      priceFrom: 28000,
      priceWas: 33000,
      discountPct: 15,
      bestseller: false,
      rating: 4.9,
      reviewCount: 2,
      published: true,
      metaTitle: "High Altitude Adventure — 8-Day Kashmir Trek | Vertex Kashmir Holidays",
      metaDesc: "8-day Kashmir adventure: Vishansar & Krishnasar lake trek, Apharwat summit, Sonmarg glacier. Starting ₹28,000. Book with Vertex Kashmir Holidays.",
      ogImage: "https://picsum.photos/seed/adventure-kashmir/1200/630",
    },
  });

  const tour4Details = {
    tagline: "Experience Kashmir through the eyes of royalty 👑",
    highlights: JSON.stringify([
      "👑 Heritage Houseboat",
      "🤵 Personal Butler",
      "🚠 Private Gondola Cabin",
      "🍽️ Wazwan Tasting Menu",
      "🧣 Bespoke Pashmina",
    ]),
    faqs: JSON.stringify([
      { question: "What makes this a luxury package?", answer: "A restored Maharaja-era cedar houseboat, a personal butler, private shikara on call 24/7, private Gondola cabin, and a bespoke Pashmina — every detail is arranged before you arrive." },
      { question: "What is the advance payment?", answer: "Just 20% to lock your dates. The balance is payable 7 days before the trip starts, securely via Razorpay." },
      { question: "Is the experience private?", answer: "Entirely. All transfers, dining and excursions are private to your party, hosted by a dedicated personal host." },
      { question: "What is the cancellation policy?", answer: "Free cancellation up to 15 days before departure. Between 7–15 days, the 20% advance is held as credit for 12 months." },
    ]),
    startCity: "Srinagar",
    transport: "Luxury Vehicle",
    difficulty: "Easy",
    bestTime: "Apr – Oct",
    tourType: "Private Luxury",
    pickupDrop: "Srinagar Airport",
    happyCount: 1500,
  };
  const tour4 = await prisma.tour.upsert({
    where: { slug: "royal-kashmir-luxury" },
    update: { badge: "LUXURY", badgeColor: "orange", ...tour4Details },
    create: {
      ...tour4Details,
      title: "Royal Kashmir — Luxury Houseboat Retreat",
      slug: "royal-kashmir-luxury",
      badge: "LUXURY",
      badgeColor: "orange",
      category: TourCategory.LUXURY,
      duration: 5,
      excerpt: "Stay on a heritage 5-star houseboat, dine at Srinagar's finest, and experience Kashmir through the eyes of royalty — butler service, private shikara, and bespoke itinerary.",
      description:
        "Five nights of uncompromising luxury in the heart of Kashmir. Your suite is a restored Maharaja-era cedar houseboat, hand-carved and appointed with Pashmina soft furnishings. Private shikara at all hours, personal butler, Wazwan tasting menus, a curated shopping experience with master craftsmen — everything arranged before you arrive. This is Kashmir without compromise.",
      coverImage: "https://picsum.photos/seed/luxury-kashmir/1600/900",
      gallery: JSON.stringify([
        "https://picsum.photos/seed/luxury-1/1600/900",
        "https://picsum.photos/seed/luxury-2/1600/900",
        "https://picsum.photos/seed/luxury-3/1600/900",
        "https://picsum.photos/seed/luxury-4/1600/900",
        "https://picsum.photos/seed/luxury-5/1600/900",
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: "Private Airport Transfer & Houseboat Arrival", description: "Met at Srinagar airport by your personal host. Transfer to your heritage deluxe houseboat on Dal Lake in a private shikara. Champagne welcome, tour of your cedar-carved suite. Evening candlelit dinner on the upper deck." },
        { day: 2, title: "Floating City Dawn & Mughal Gardens", description: "Pre-dawn private shikara ride to the floating flower and vegetable market — a sight few travellers witness. Curated Mughal garden tour with an art historian. Afternoon spa treatment with Kashmiri oils. Evening at leisure." },
        { day: 3, title: "Gulmarg Gondola Private Day Trip", description: "Dedicated vehicle to Gulmarg. Private Gondola cabin to Apharwat (Phase 2). Champagne picnic at the summit with panoramic Himalayan views. Return to Srinagar for a Wazwan tasting menu dinner hosted by a local chef." },
        { day: 4, title: "Artisan Quarter & Bespoke Shopping", description: "Private morning with Kashmiri master weavers, carpet makers, and papier-mâché artisans. Bespoke Pashmina consultation — your shawl is started while you watch. Afternoon at leisure on the houseboat." },
        { day: 5, title: "Shankaracharya Sunrise & Departure", description: "Pre-dawn drive to Shankaracharya hill for a private sunrise. Leisurely farewell breakfast on deck. Pashmina shawl delivered before departure. Private transfer to airport." },
      ]),
      inclusions: JSON.stringify([
        "4 nights in a heritage deluxe houseboat suite on Dal Lake",
        "All meals (full board) — including Wazwan tasting menu dinner",
        "Personal butler service throughout",
        "Private shikara available 24/7",
        "Private Gondola cabin in Gulmarg",
        "Art historian guide for Mughal gardens",
        "Bespoke Pashmina shawl (one per couple)",
        "Artisan workshop visit with a master craftsman",
        "Kashmiri spa treatment (90 min)",
        "All transfers in private luxury vehicle",
        "Airport meet-and-greet",
        "All taxes and service charges",
      ]),
      exclusions: JSON.stringify([
        "Airfare",
        "Additional Pashmina or craft purchases",
        "Alcoholic beverages beyond welcome package",
        "Personal expenses",
        "Travel insurance",
      ]),
      priceFrom: 85000,
      priceWas: 95000,
      discountPct: 10,
      bestseller: false,
      rating: 5.0,
      reviewCount: 2,
      published: true,
      metaTitle: "Royal Kashmir Luxury — 5-Day Heritage Houseboat | Vertex Kashmir Holidays",
      metaDesc: "5-night luxury Kashmir retreat: heritage houseboat, private butler, Wazwan dinner, bespoke Pashmina. Starting ₹85,000/couple. Book your royal Kashmir experience.",
      ogImage: "https://picsum.photos/seed/luxury-kashmir/1200/630",
    },
  });
  console.log("✓ Tours");

  // ── TourDestination joins ───────────────────────────────────────────────────
  const joins = [
    { tourId: tour1.id, destinationId: srinagar.id },
    { tourId: tour1.id, destinationId: gulmarg.id },
    { tourId: tour1.id, destinationId: pahalgam.id },
    { tourId: tour2.id, destinationId: srinagar.id },
    { tourId: tour2.id, destinationId: gulmarg.id },
    { tourId: tour2.id, destinationId: pahalgam.id },
    { tourId: tour2.id, destinationId: sonmarg.id },
    { tourId: tour3.id, destinationId: sonmarg.id },
    { tourId: tour3.id, destinationId: gulmarg.id },
    { tourId: tour3.id, destinationId: pahalgam.id },
    { tourId: tour4.id, destinationId: srinagar.id },
  ];
  for (const j of joins) {
    await prisma.tourDestination.upsert({
      where: { tourId_destinationId: { tourId: j.tourId, destinationId: j.destinationId } },
      update: {},
      create: j,
    });
  }
  console.log("✓ Tour-Destination joins");

  // ── Reviews ─────────────────────────────────────────────────────────────────
  // Clear existing reviews and recreate for idempotency
  await prisma.review.deleteMany({ where: { tourId: { in: [tour1.id, tour2.id, tour3.id, tour4.id] } } });

  await prisma.review.createMany({
    data: [
      // Tour 1 – Honeymoon
      { tourId: tour1.id, name: "Priya & Rahul Sharma", rating: 5, body: "Absolutely magical! The houseboat at night with candles reflecting on Dal Lake was something out of a dream. Vertex arranged every detail perfectly — from the rose petals on our bed to the private gondola cabin in Gulmarg. We'll never forget this.", approved: true },
      { tourId: tour1.id, name: "Anika & Vikram Nair", rating: 5, body: "Kashmir exceeded every expectation. The Pahalgam section with the Betaab Valley visit was our favourite — so green and peaceful. The team at Vertex was always a call away. Highly recommend this package for any couple.", approved: true },
      // Tour 2 – Family
      { tourId: tour2.id, name: "Sunita Mehra", rating: 5, body: "My kids are still talking about the snowball fight at Thajiwas Glacier! The houseboat stay was an unforgettable experience for them. Vertex managed everything so seamlessly — pacing was perfect for young children.", approved: true },
      { tourId: tour2.id, name: "Rajesh Patel", rating: 4, body: "A wonderful family holiday. The Gulmarg day was the highlight — the gondola views were breathtaking. Would give 5 stars but one transfer was slightly delayed. Overall an excellent experience and great value.", approved: true },
      // Tour 3 – Adventure
      { tourId: tour3.id, name: "Karan Mehta", rating: 5, body: "The Vishansar and Krishnasar lake trek was the most beautiful landscape I've ever walked through. Our guide Bashir was incredibly knowledgeable and kept us safe. Vertex's logistics on a complex 8-day trek were flawless.", approved: true },
      { tourId: tour3.id, name: "Neha Joshi", rating: 5, body: "Did this solo as a female trekker — felt completely safe and well-supported the whole time. The Apharwat summit day was exhilarating. The camping equipment was high quality. Will definitely book another Vertex adventure.", approved: true },
      // Tour 4 – Luxury
      { tourId: tour4.id, name: "Deepika & Arjun Kapoor", rating: 5, body: "Worth every rupee. The houseboat was like a floating palace — cedar-carved walls, hand-embroidered cushions, and a butler who anticipated our every need. The private dawn shikara to the flower market was magical. Vertex sets the gold standard.", approved: true },
      { tourId: tour4.id, name: "Sunanda Krishnamurthy", rating: 5, body: "I've travelled extensively but Kashmir with Vertex was truly exceptional. The Wazwan tasting dinner, the Pashmina consultation with the master weaver, and the summit picnic in Gulmarg were each memorable on their own. Together they were extraordinary.", approved: true },
    ],
  });
  console.log("✓ Reviews");

  // ── Blog ────────────────────────────────────────────────────────────────────
  const blogPosts = [
    {
      title: "15 Best Places to Visit in Kashmir This Summer 2026",
      slug: "15-best-places-to-visit-in-kashmir-2026",
      excerpt: "From snow-capped Gulmarg to the tulip gardens of Srinagar — discover the most beautiful places in Kashmir you shouldn't miss this season.",
      body: "<p>Kashmir — the paradise on earth — has no shortage of breathtaking places. With so many valleys, lakes, meadows, and peaks, planning where to go can feel overwhelming. Here are the 15 best places to visit this summer, as recommended by our Srinagar-based guides.</p><h2>1. Gulmarg — The Meadow of Flowers</h2><p>Perched at 2,650 m, Gulmarg is Kashmir's crown jewel. The Gulmarg Gondola lifts you to Apharwat Peak (4,200 m) for panoramic Himalayan views. In summer, rolling meadows of wildflowers replace the ski slopes. Don't miss the world's highest golf course.</p><h2>2. Pahalgam — Valley of Shepherds</h2><p>Nestled at 2,130 m where the Lidder river carves through emerald valleys, Pahalgam is Kashmir's most romantic destination. Betaab Valley — Bollywood's favourite backdrop — and the pristine Aru Valley are highlights. The river is ideal for trout fishing and riverside picnics.</p><h2>3. Srinagar — The Summer Capital</h2><p>Dal Lake with its ornate houseboats, shikara rides through floating markets, the Mughal gardens of Shalimar Bagh and Nishat Bagh, and the old city's wooden mosques — Srinagar is inexhaustible. The Shankaracharya temple hill offers the best panoramic view of the entire valley.</p><h2>4. Sonmarg — Meadow of Gold</h2><p>At 2,800 m, Sonmarg is the gateway to Kashmir's high-altitude wilderness. The Thajiwas Glacier is accessible by pony even in summer. The multi-day trek to Krishnasar and Vishansar alpine lakes is one of India's most beautiful treks.</p><h2>5. Yusmarg — The Hidden Meadow</h2><p>Far fewer tourists reach Yusmarg, and that's exactly its charm. This peaceful high-altitude meadow, carpeted in spring flowers and framed by fir forests, is perfect for those seeking Kashmir without the crowds. Ideal for day trips from Srinagar.</p><h2>6. Doodhpathri — Valley of Milk</h2><p>Named after its milky-white streams, Doodhpathri is completely undeveloped — no shops, no hotels, just a pristine valley of waterfalls and wildflowers. A hidden gem best visited as a day trip from Srinagar.</p><h2>7. Nagin Lake — Dal's Quieter Sister</h2><p>Connected to Dal by a narrow channel, Nagin is smaller, cleaner, and less crowded. Many travellers prefer a houseboat stay here for the tranquility while staying within easy reach of Srinagar's sights.</p><h2>8. Betaab Valley — Bollywood's Paradise</h2><p>Located just 15 km from Pahalgam, Betaab Valley became famous after the 1983 Bollywood film. Its lush bowl of green meadows, snow-streaked peaks, and the rushing Lidder river create picture-perfect scenery.</p><h2>9. Aru Valley</h2><p>One of the least-visited beautiful valleys in Kashmir, Aru is a 12 km drive from Pahalgam. The tiny village of Aru is the starting point for several alpine lake treks and is perfect for gentle walks surrounded by pine forests.</p><h2>10. Baisaran — Mini Switzerland</h2><p>A 30-minute pony ride above Pahalgam reveals Baisaran — an open meadow with sweeping views often called Kashmir's mini Switzerland. In spring, the meadow is blanketed in buttercups and daisies.</p><h2>11. Wular Lake</h2><p>One of Asia's largest freshwater lakes, Wular is less visited but deeply beautiful. Surrounded by the Haramukh range, it is a major stopover for migratory birds and the lotus beds in summer are spectacular.</p><h2>12. Verinag Garden</h2><p>A Mughal octagonal pool garden at the source of the Jhelum river. Built by Emperor Jehangir in 1620, the transparent spring water and Himalayan backdrop make this a quiet, contemplative stop.</p><h2>13. Dachigam National Park</h2><p>Just 21 km from Srinagar, Dachigam is the only habitat of the critically endangered Hangul (Kashmir stag). Autumn visits offer the best wildlife sightings. Prior permits required.</p><h2>14. Lolab Valley</h2><p>The apple orchards and dense forests of Lolab valley are a riot of pink and white blossoms in April–May. This off-beaten valley is the real Kashmir of village life and traditional culture.</p><h2>15. Bangus Valley</h2><p>One of Kashmir's best-kept secrets, Bangus is a remote double-meadow valley near Handwara. Visited only by serious trekkers, it rewards with complete solitude and extraordinary Himalayan beauty.</p><h2>When to Visit</h2><p>The ideal window is <strong>April to October</strong>. April brings tulip blooms in Srinagar; May–June are perfect for Gulmarg and Pahalgam wildflowers; July–August for high-altitude treks; September for golden-lit landscapes with fewer crowds.</p>",
      coverImage: "https://picsum.photos/seed/blog-kashmir-places/1600/900",
      author: "Hamid Bashir",
      category: "Travel Guide",
      readTime: 7,
      published: true,
      publishedAt: new Date("2026-05-10"),
      metaTitle: "15 Best Places to Visit in Kashmir This Summer 2026 — Vertex Kashmir",
      metaDesc: "Discover the 15 most beautiful destinations in Kashmir this summer — from Gulmarg's meadows to Srinagar's Dal Lake. Complete guide by local experts.",
      ogImage: "https://picsum.photos/seed/blog-kashmir-places/1200/630",
    },
    {
      title: "The Perfect 7-Day Kashmir Itinerary for First-Timers (2026)",
      slug: "perfect-7-day-kashmir-itinerary-first-timers-2026",
      excerpt: "Planning your first trip to Kashmir? Use this exact 7-day itinerary — crafted by our local guides — to see the very best of the valley without missing a beat.",
      body: "<p>Kashmir rewards the well-planned traveller. This 7-day itinerary — crafted by our Srinagar-based team — covers Dal Lake, Pahalgam's meadows, Sonmarg's glacier, and Gulmarg's famous Gondola in exactly one week.</p><h2>Quick Overview</h2><ul><li><strong>Duration:</strong> 7 days / 6 nights</li><li><strong>Best Season:</strong> April – October</li><li><strong>Difficulty:</strong> Easy</li><li><strong>Covers:</strong> Srinagar, Pahalgam, Sonmarg, Gulmarg</li></ul><h2>Day 1: Arrival in Srinagar — Dal Lake Welcome</h2><p>Arrive at Srinagar's Sheikh ul-Alam International Airport. Transfer to a deluxe houseboat on Dal Lake in a private vehicle. Afternoon shikara ride through the lake's famous floating vegetable and flower markets. Welcome dinner on the houseboat deck under the stars.</p><h2>Day 2: Srinagar Sightseeing</h2><p>Early morning at the floating flower market (6–8 AM) — a magical sight most tourists miss. Visit the Mughal gardens: Nishat Bagh and Shalimar Bagh, built by Emperor Jehangir in the 17th century. Afternoon: Shankaracharya temple for panoramic valley views, followed by the old city's Jamia Masjid and the Lal Chowk handicraft market.</p><h2>Day 3: Srinagar to Pahalgam</h2><p>A scenic 3-hour drive via the Sindh valley. Stop at the Awantipora ruins (9th-century Hindu temple) and the saffron fields of Pampore. Check in to a riverside resort in Pahalgam. Evening nature walk along the crystal-clear Lidder river.</p><h2>Day 4: Pahalgam — Betaab Valley and Aru</h2><p>Full day excursion in Pahalgam. Betaab Valley — made famous by Bollywood — is a lush bowl of green surrounded by pine forests. Then to Aru Valley, even more remote and peaceful. Pony rides through both valleys are highly recommended.</p><h2>Day 5: Pahalgam to Gulmarg via Sonmarg</h2><p>Drive to Sonmarg (3 hrs) for a morning pony ride to the Thajiwas Glacier — even in summer there is snow here. Picnic lunch at the glacier base. Afternoon drive to Gulmarg (2.5 hrs). Evening stroll through the famous wildflower meadows.</p><h2>Day 6: Gulmarg — Gondola and Alpine Summit</h2><p>The centrepiece of any Kashmir trip. Take the Gondola to Kongdori (Phase 1) and Apharwat Peak at 4,200 m (Phase 2) — views stretch to Nanga Parbat on clear days. Afternoon horse ride through Gulmarg's legendary golf course meadow.</p><h2>Day 7: Gulmarg to Srinagar and Departure</h2><p>Leisurely morning in Gulmarg. Drive back to Srinagar (2 hrs). Last-minute shopping for saffron, Pashmina shawls, and Kashmiri walnut wood crafts at the Polo View Market. Transfer to the airport with a heart full of Kashmir.</p><h2>What's Included in Most Packages</h2><ul><li>Houseboat stay on Dal Lake (2 nights)</li><li>Resort accommodation in Pahalgam (2 nights) and Gulmarg (2 nights)</li><li>All transfers in private AC vehicle</li><li>Gondola tickets (Phase 1 and 2) in Gulmarg</li><li>Pony rides in Pahalgam and Sonmarg</li><li>Shikara ride on Dal Lake</li><li>Breakfast and dinner throughout</li></ul><p>This itinerary is the basis for our <a href=\"/tours/honeymoon-in-heaven\">Honeymoon in Heaven</a> and <a href=\"/tours/family-kashmir-explorer\">Family Kashmir Explorer</a> packages.</p>",
      coverImage: "https://picsum.photos/seed/blog-7day-itinerary/1600/900",
      author: "Aisha Khan",
      category: "Itinerary",
      readTime: 6,
      published: true,
      publishedAt: new Date("2026-05-20"),
      metaTitle: "The Perfect 7-Day Kashmir Itinerary for First-Timers (2026) — Vertex Kashmir",
      metaDesc: "Complete 7-day Kashmir itinerary for first-time visitors: Srinagar, Pahalgam, Sonmarg, Gulmarg. Day-by-day guide by local experts.",
      ogImage: "https://picsum.photos/seed/blog-7day-itinerary/1200/630",
    },
    {
      title: "Kashmir Packing List: What to Pack and What to Skip",
      slug: "kashmir-packing-list-what-to-pack",
      excerpt: "Confused about what to pack for Kashmir? Our local experts break down exactly what you need — and what will just weigh you down.",
      body: "<p>Packing for Kashmir is trickier than most destinations. The weather varies dramatically: Srinagar (1,585 m) can be warm and sunny while Gulmarg (2,650 m) is cold and windy. This guide is written by our Srinagar-based team who answer packing questions from guests every single day.</p><h2>Clothing (Summer: April–October)</h2><ul><li><strong>Layering base:</strong> 2–3 lightweight full-sleeve t-shirts — UV is intense at altitude, so full sleeves are smart even in summer</li><li><strong>Midlayer:</strong> 1–2 light fleece or sweater — essential even in July for evenings and the Gondola ride</li><li><strong>Outer layer:</strong> A windproof jacket — critical for the Apharwat summit and any high-altitude day</li><li><strong>Bottoms:</strong> Comfortable trousers (not jeans — too heavy when wet). Dress modestly, especially in Srinagar's old city</li><li><strong>Footwear:</strong> Good walking shoes. If trekking, proper hiking boots with ankle support</li><li><strong>Warm socks:</strong> Essential for Gulmarg and Sonmarg days</li><li><strong>Rain poncho:</strong> Summer showers are common, especially in Pahalgam</li></ul><h2>Documents and Money</h2><ul><li>Original government ID (required at checkpoints in J&amp;K)</li><li>Printed copies of hotel bookings and tour vouchers</li><li>Emergency contact card with your guide's local number</li><li>Cash in INR — ATMs exist in Srinagar but are unreliable in Pahalgam and Gulmarg</li><li>Travel insurance documents</li></ul><h2>Electronics</h2><ul><li>Phone, charger, and a portable power bank (essential for long drive days)</li><li>Universal travel adapter (India uses Type D/M sockets)</li><li>Camera with extra memory cards — Kashmir is extraordinarily photogenic</li><li>Earphones for the scenic mountain drives</li></ul><h2>Health and Toiletries</h2><ul><li>High-SPF sunscreen (SPF 50+ minimum — UV increases with altitude)</li><li>Lip balm with SPF</li><li>Basic first aid: paracetamol, ORS sachets, altitude sickness tablets if going above 3,500 m</li><li>Personal medications (Srinagar pharmacies are well-stocked; Gulmarg and Pahalgam less so)</li><li>Insect repellent for meadow areas in the evening</li></ul><h2>What NOT to Pack</h2><ul><li><strong>Heavy suitcases</strong> — mountain roads and houseboat transfers favour backpacks</li><li><strong>Shorts and sleeveless tops</strong> — impractical at altitude and disrespectful in local areas</li><li><strong>More than 2 pairs of shoes</strong> — one walking shoe and one sandal is enough</li><li><strong>Hair dryer or straightener</strong> — power supply in mountain areas is limited</li></ul><h2>Local Buys Worth Space in Your Bag</h2><ul><li><strong>Kashmiri saffron</strong> — the world's best, from Pampore. Buy only from certified shops</li><li><strong>Pashmina shawl</strong> — a genuine Pashmina from a certified weaver is worth every rupee</li><li><strong>Kashmiri dry fruits</strong> — walnuts, apricots, and saffron-infused almonds</li><li><strong>Papier-mâché handicrafts</strong> — lightweight and uniquely Kashmiri souvenirs</li></ul><h2>Final Tips</h2><p>Always carry a warm layer even in July — the Gondola summit at 4,200 m is cold year-round. Download offline maps before you go — mobile data is patchy in mountain areas. Pack light, stay flexible, and let Kashmir surprise you.</p>",
      coverImage: "https://picsum.photos/seed/blog-packing-list/1600/900",
      author: "Farhan Ali",
      category: "Tips",
      readTime: 5,
      published: true,
      publishedAt: new Date("2026-06-01"),
      metaTitle: "Kashmir Packing List: What to Pack and What to Skip — Vertex Kashmir",
      metaDesc: "Complete Kashmir packing list by local experts. Clothing, documents, electronics, and what NOT to bring. Summer and winter packing tips.",
      ogImage: "https://picsum.photos/seed/blog-packing-list/1200/630",
    },
  ];

  for (const post of blogPosts) {
    await prisma.blog.upsert({
      where: { slug: post.slug },
      update: { category: post.category, readTime: post.readTime },
      create: post,
    });
  }
  console.log("✓ Blog posts");

  // ── Blog listing page ─────────────────────────────────────────────────────
  // Align the 3 rich posts with the listing's canonical categories + mark the
  // featured hero story.
  await prisma.blog.update({
    where: { slug: "15-best-places-to-visit-in-kashmir-2026" },
    data: {
      featured: true,
      category: "Kashmir",
      authorImage: "https://picsum.photos/seed/author-hamid/110",
      authorRole: "Senior Travel Writer, Srinagar",
      authorBio:
        "Born and raised in Kashmir. 10+ years documenting the valley's hidden corners for travellers from around the world.",
    },
  });
  await prisma.blog.update({
    where: { slug: "perfect-7-day-kashmir-itinerary-first-timers-2026" },
    data: {
      category: "Travel Tips",
      authorImage: "https://picsum.photos/seed/author-aisha/110",
      authorRole: "Trip Designer, Vertex Kashmir",
      authorBio:
        "Crafts balanced, local-approved itineraries that show first-timers the very best of Kashmir without the rush.",
    },
  });
  await prisma.blog.update({
    where: { slug: "kashmir-packing-list-what-to-pack" },
    data: {
      category: "Travel Tips",
      authorImage: "https://picsum.photos/seed/author-farhan/110",
      authorRole: "Local Travel Expert, Srinagar",
      authorBio:
        "Answers travellers' packing and logistics questions every single day from our Srinagar HQ.",
    },
  });

  await prisma.blogContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroKicker: "TRAVEL BLOG",
      heroTitle: "Kashmir Stories & Travel Guide",
      heroSubtitle: "Real stories, local tips, and travel inspiration from the heart of Kashmir.",
      heroImage: "/hero/doodhpathri-lg.webp",
      heroImageMobile: "/hero/doodhpathri.webp",
      heroSearchPlaceholder: "Search articles, guides, destinations...",
      aboutTitle: "About Our Blog",
      aboutText:
        "We're a team of local travel experts sharing authentic Kashmir experiences, travel guides, and insider tips to help you plan the perfect trip.",
      aboutCtaLabel: "Learn more about us",
      aboutCtaHref: "/about",
      newsletterTitle: "Subscribe to Newsletter",
      newsletterText: "Get the latest travel tips, exclusive deals, and Kashmir updates.",
    },
  });
  console.log("✓ BlogContent");

  await prisma.blogCategory.deleteMany();
  await prisma.blogCategory.createMany({
    data: [
      { name: "Kashmir", slug: "kashmir", icon: "m3 20 6-12 4 7 3-4 5 9Z", sortOrder: 0 },
      { name: "Travel Tips", slug: "travel-tips", icon: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z", sortOrder: 1 },
      { name: "Honeymoon", slug: "honeymoon", icon: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z", sortOrder: 2 },
      { name: "Adventure", slug: "adventure", icon: "m8 3 4 8 5-5 4 14H3l5-7Z", sortOrder: 3 },
      { name: "Food", slug: "food", icon: "M4 19h16 M5 19a7 7 0 0 1 14 0 M12 12V9", sortOrder: 4 },
      { name: "Culture", slug: "culture", icon: "M12 3 3 8v2h18V8Z M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 21h18", sortOrder: 5 },
      { name: "News", slug: "news", icon: "M4 22h14a2 2 0 0 0 2-2V6l-4-4H6a2 2 0 0 0-2 2v16Z M8 10h8 M8 14h8 M8 18h5", sortOrder: 6 },
    ],
  });
  console.log("✓ BlogCategories");

  // Listing posts captured from the previously-static component arrays.
  const listingPosts = [
    { seed: "b-srinagar", category: "Kashmir", title: "Srinagar in Summer: 10 Things You Must Do", date: "2026-05-26", readTime: 6 },
    { seed: "b-packing", category: "Travel Tips", title: "Packing List for Kashmir Trip: What to Pack & What to Skip", date: "2026-05-24", readTime: 5 },
    { seed: "b-romantic", category: "Honeymoon", title: "7 Romantic Experiences for Couples in Kashmir", date: "2026-05-23", readTime: 7 },
    { seed: "b-apharwat", category: "Adventure", title: "Apharwat Peak Trek & Gondola Ride: Ultimate Guide", date: "2026-05-21", readTime: 6 },
    { seed: "b-dishes", category: "Food", title: "Must Try 15 Kashmiri Dishes You'll Love", date: "2026-05-19", readTime: 8 },
    { seed: "b-tulip", category: "Kashmir", title: "Tulip Garden Kashmir: Complete Guide 2026", date: "2026-05-17", readTime: 4 },
    { seed: "b-pahalgam", category: "Kashmir", title: "Pahalgam Travel Guide: Best Time, Places & Hotels", date: "2026-05-16", readTime: 6 },
    { seed: "b-culture", category: "Culture", title: "Kashmiri Culture & Traditions: A Complete Guide", date: "2026-05-15", readTime: 7 },
    { seed: "b-winter", category: "Travel Tips", title: "Kashmir in Winter: Everything You Need to Know", date: "2026-05-14", readTime: 5 },
    // Trending posts (sidebar)
    { seed: "tr-gondola", category: "Adventure", title: "Gulmarg Gondola: Everything You Need to Know", date: "2026-05-25", readTime: 5, trending: true },
    { seed: "tr-wazwan", category: "Food", title: "Kashmiri Wazwan: A Foodie's Paradise", date: "2026-05-22", readTime: 6, trending: true },
    { seed: "tr-tarsar", category: "Adventure", title: "Trek to Tarsar Marsar: Complete Guide 2026", date: "2026-05-20", readTime: 7, trending: true },
    { seed: "tr-besttime", category: "Travel Tips", title: "Best Time to Visit Kashmir Month by Month", date: "2026-05-18", readTime: 5, trending: true },
  ];

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  for (const p of listingPosts) {
    const slug = slugify(p.title);
    const data = {
      title: p.title,
      excerpt: `${p.title} — local insights and practical tips from the Vertex Kashmir team.`,
      body: `<p>${p.title} — full guide coming soon. Our local experts are putting the finishing touches on this article.</p>`,
      coverImage: `https://picsum.photos/seed/${p.seed}/800/500`,
      author: "Vertex Editorial Team",
      authorImage: `https://picsum.photos/seed/${p.seed}-author/110`,
      authorRole: "Vertex Editorial",
      authorBio:
        "The Vertex Kashmir Holidays editorial team shares local stories, guides, and practical tips straight from the valley.",
      category: p.category,
      readTime: p.readTime,
      trending: p.trending ?? false,
      published: true,
      publishedAt: new Date(p.date),
    };
    await prisma.blog.upsert({
      where: { slug },
      update: { category: data.category, readTime: data.readTime, trending: data.trending },
      create: { slug, ...data },
    });
  }
  console.log("✓ Blog listing posts");

  // ── SiteSettings ────────────────────────────────────────────────────────────
  const siteSocials = {
    instagram: "https://www.instagram.com/vertexkashmirholidays",
    facebook: "https://www.facebook.com/vertexkashmirholidays",
    youtube: "https://www.youtube.com/@vertexkashmirholidays",
    twitter: "https://x.com/vertexkashmir",
  };
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { ...siteSocials },
    create: {
      id: "singleton",
      siteName: "Vertex Kashmir Holidays",
      siteTagline: "While the plains scorch, Kashmir is calling.",
      siteEmail: "hello@vertexkashmirholidays.com",
      sitePhone: "+91 94190 00000",
      siteAddress: "Residency Road, Srinagar, Jammu & Kashmir 190001",
      whatsapp: "+919419000000",
      ...siteSocials,
      metaTitle: "Vertex Kashmir Holidays — Premium Kashmir Tourism & Booking",
      metaDesc:
        "Discover Kashmir with Vertex — curated honeymoon, family, adventure, and luxury packages. Houseboat stays, Gondola rides, glacier treks, and expert guides. Book online.",
      ogImage: "https://picsum.photos/seed/vertex-kashmir-og/1200/630",
    },
  });
  console.log("✓ SiteSettings");

  // ── Home page content ───────────────────────────────────────────────────────
  // Title strings support accent markers: *warm gradient* and ~cool gradient~.

  await prisma.homeContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroBadge: "MONSOON-READY KASHMIR TRIPS · 2026",
      heroTitle: "While the plains\n*scorch,* Kashmir is ~calling.~",
      heroSubtitle:
        "Curated Kashmir holidays — handcrafted by locals, priced for honest travellers. Step through to 18°C.",
      heroCtaPrimaryLabel: "Explore Packages",
      heroCtaPrimaryHref: "#packages",
      heroCtaSecondaryLabel: "Watch Film",
      heroCtaSecondaryHref: "#",
      formKicker: "PLAN YOUR KASHMIR TRIP",
      formTitle: "Get a quote in 60 seconds",
      formSubtitle: "Free, no spam — real human on WhatsApp.",
      formButtonLabel: "Request Free Itinerary →",
      formNote: "12,248+ planned their trip this month",
      formAvatars: JSON.stringify([
        "https://picsum.photos/seed/p1/60",
        "https://picsum.photos/seed/p2/60",
        "https://picsum.photos/seed/p3/60",
      ]),
      aboutPara1:
        "Vertex Kashmir Holidays is a locally based travel company run by people who grew up between Dal Lake and Gulmarg's meadows. We design every trip ourselves — no resellers, no Delhi call centres, no commissions stacked on your bill.",
      aboutPara2:
        "From honeymoon shikaras to Great Lakes treks, your itinerary is built by a neighbour, not an algorithm — and we stay on call 24/7 while you're in the valley.",
      aboutImage1: "https://picsum.photos/seed/about-dal/520/640",
      aboutImage2: "https://picsum.photos/seed/about-gulmarg/420/420",
      aboutCardEmoji: "🏔️",
      aboutCardTitle: "Srinagar HQ",
      aboutCardSubtitle: "Boulevard Road, Dal Gate",
      aboutRatingTitle: "★ 4.9 Google Rating",
      aboutRatingSubtitle: "1,800+ verified reviews",
    },
  });
  console.log("✓ HomeContent");

  const homeSections = [
    {
      key: "videos",
      kicker: "REAL TRAVELLERS, REAL FOOTAGE",
      title: "Watch their ~Kashmir~ moments",
      subtitle:
        "Unscripted video reviews straight from the valley — shikara mornings, gondola rides and snow days.",
    },
    {
      key: "packages",
      kicker: "BESTSELLERS",
      title: "Handpicked Kashmir packages",
      subtitle: "Fine-tuned by locals, loved by 12,000+ travellers.",
      ctaLabel: "View All Packages →",
      ctaHref: "/tours",
    },
    {
      key: "why",
      kicker: "WHY CHOOSE VERTEX KASHMIR",
      title: "We live here. So your trip ~actually works.~",
    },
    {
      key: "destinations",
      kicker: "DESTINATIONS",
      title: "Where the valley takes you",
      ctaLabel: "View All Destinations →",
      ctaHref: "/destinations",
    },
    {
      key: "about",
      kicker: "ABOUT US",
      title: "Born in Srinagar.\n~Zero middlemen.~",
      ctaLabel: "Meet the Team →",
      ctaHref: "/about",
    },
    {
      key: "offers",
      kicker: "LIMITED-TIME OFFERS",
      title: "Deals that melt *faster than snow*",
      subtitle: "Monsoon window: June – September 2026",
    },
    {
      key: "testimonials",
      kicker: "TESTIMONIALS",
      title: "12,000 travellers can't be wrong",
    },
    {
      key: "blogs",
      kicker: "FROM THE JOURNAL",
      title: "Stories & guides from the valley",
      ctaLabel: "Read the Blog →",
      ctaHref: "/blog",
    },
    {
      key: "toursHero",
      title: "Kashmir Tour Packages",
      subtitle: "Handpicked experiences by locals, crafted with love.",
    },
  ];
  for (const section of homeSections) {
    await prisma.homeSection.upsert({
      where: { key: section.key },
      update: section,
      create: section,
    });
  }
  console.log("✓ HomeSections");

  await prisma.heroSlide.deleteMany();
  await prisma.heroSlide.createMany({
    data: [
      { image: "/hero/hero-lg.webp", imageMobile: "/hero/hero.webp", alt: "Kashmir valley panorama", sortOrder: 0 },
      { image: "/hero/gulmarg-lg.webp", imageMobile: "/hero/gulmarg.webp", alt: "Gulmarg meadows", sortOrder: 1 },
      { image: "/hero/srinagar-lg.webp", imageMobile: "/hero/srinagar.webp", alt: "Srinagar and Dal Lake", sortOrder: 2 },
      { image: "/hero/pahalgam-lg.webp", imageMobile: "/hero/pahalgam.webp", alt: "Pahalgam valley", sortOrder: 3 },
      { image: "/hero/sonamarg-lg.webp", imageMobile: "/hero/sonamarg.webp", alt: "Sonamarg meadows", sortOrder: 4 },
      { image: "/hero/gurez-lg.webp", imageMobile: "/hero/gurez.webp", alt: "Gurez valley", sortOrder: 5 },
      { image: "/hero/shikara-lg.webp", imageMobile: "/hero/shikara.webp", alt: "Shikara on Dal Lake", sortOrder: 6 },
    ],
  });
  console.log("✓ HeroSlides");

  await prisma.siteStat.deleteMany();
  await prisma.siteStat.createMany({
    data: [
      { section: "hero", label: "Travellers", value: "12000", suffix: "+", sortOrder: 0 },
      { section: "hero", label: "Curated Trips", value: "500", suffix: "+", sortOrder: 1 },
      { section: "hero", label: "Years", value: "15", suffix: "+", sortOrder: 2 },
      { section: "hero", label: "Rating", value: "4.9★", sortOrder: 3 },
      { section: "about", label: "Years on Ground", value: "15", suffix: "+", sortOrder: 0 },
      { section: "about", label: "Local Partners", value: "120", suffix: "+", sortOrder: 1 },
      { section: "about", label: "On-trip Support", value: "24/7", sortOrder: 2 },
    ],
  });
  console.log("✓ SiteStats");

  await prisma.tickerItem.deleteMany();
  await prisma.tickerItem.createMany({
    data: [
      "❄️ Gulmarg 18°C Today",
      "🛶 Shikara Sunrise Rides",
      "🏔️ Great Lakes Trek Open",
      "🌷 Tulip Season Bookings Live",
      "✅ J&K Licensed Agency",
      "🔒 Razorpay Secured",
      "📞 24/7 Local Support",
      "🚫 Zero Middlemen",
    ].map((text, i) => ({ text, sortOrder: i })),
  });
  console.log("✓ TickerItems");

  await prisma.videoReview.deleteMany();
  await prisma.videoReview.createMany({
    data: [
      { name: "Aarav & Meera", place: "Honeymoon · Pahalgam", duration: "0:42", thumbnail: "https://picsum.photos/seed/vid-honeymoon/480/840", sortOrder: 0 },
      { name: "The Sharma Family", place: "Snow Day · Gulmarg", duration: "1:05", thumbnail: "https://picsum.photos/seed/vid-family/480/840", sortOrder: 1 },
      { name: "Rohit", place: "Great Lakes Trek", duration: "0:58", thumbnail: "https://picsum.photos/seed/vid-trek/480/840", sortOrder: 2 },
      { name: "Fatima & Zoya", place: "Shikara Morning · Dal Lake", duration: "0:36", thumbnail: "https://picsum.photos/seed/vid-shikara/480/840", sortOrder: 3 },
      { name: "Daniel", place: "Skiing · Apharwat Peak", duration: "1:12", thumbnail: "https://picsum.photos/seed/vid-ski/480/840", sortOrder: 4 },
      { name: "Priya", place: "Tulip Garden · Srinagar", duration: "0:47", thumbnail: "https://picsum.photos/seed/vid-tulip/480/840", sortOrder: 5 },
    ],
  });
  console.log("✓ VideoReviews");

  await prisma.whyChooseItem.deleteMany();
  await prisma.whyChooseItem.createMany({
    data: [
      { emoji: "🏔️", title: "Born in Kashmir", description: "Our team is from Srinagar, Pahalgam & Gulmarg — not a Delhi call centre.", sortOrder: 0 },
      { emoji: "💎", title: "Transparent Pricing", description: "What you see is what you pay. No hidden driver tip or gondola extra.", sortOrder: 1 },
      { emoji: "🗺️", title: "Honest Itineraries", description: "We tell you what's worth skipping. Real days. Real time.", sortOrder: 2 },
      { emoji: "🛟", title: "Hassle-free Travel", description: "24/7 on-ground support. Verified hotels. Sanitised cars.", sortOrder: 3 },
    ],
  });
  console.log("✓ WhyChooseItems");

  await prisma.offer.deleteMany();
  await prisma.offer.createMany({
    data: [
      {
        badge: "SAVE 25%",
        title: "Monsoon Escape Flash Sale",
        description: "5N/6D Srinagar + Gulmarg + Pahalgam. Houseboat night included.",
        image: "https://picsum.photos/seed/offer-monsoon/520/320",
        price: 18749,
        oldPrice: 24999,
        endsText: "Ends June 30",
        ctaHref: "/tours",
        sortOrder: 0,
      },
      {
        badge: "FREE SHIKARA",
        title: "Honeymoon Early-Bird",
        description: "Book 60 days ahead — candlelit shikara dinner + room upgrade free.",
        image: "https://picsum.photos/seed/offer-honeymoon/520/320",
        price: 31499,
        oldPrice: 34999,
        endsText: "July departures",
        ctaHref: "/tours/honeymoon-in-heaven",
        sortOrder: 1,
      },
      {
        badge: "GROUP DEAL",
        title: "Squad of 6+ Special",
        description: "Tempo traveller, bonfire night & rafting add-on at no extra cost.",
        image: "https://picsum.photos/seed/offer-group/520/320",
        price: 16999,
        oldPrice: 21999,
        endsText: "Limited slots",
        ctaHref: "/contact",
        sortOrder: 2,
      },
    ],
  });
  console.log("✓ Offers");

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: [
      { name: "Ananya Iyer", location: "Chennai · Honeymoon, May 2026", avatar: "https://picsum.photos/seed/t1/80", quote: "Our planner Bilal redid the whole itinerary when it rained in Pahalgam — we ended up in Doodhpathri and it was the best day of the trip.", sortOrder: 0 },
      { name: "Vikram Mehta", location: "Mumbai · Family Trip, Apr 2026", avatar: "https://picsum.photos/seed/t2/80", quote: "Travelling with my parents and a toddler, I needed zero surprises. Hotels matched photos exactly, driver was a saint, and pricing was to the rupee.", sortOrder: 1 },
      { name: "Sarah Thomas", location: "Bengaluru · Great Lakes Trek", avatar: "https://picsum.photos/seed/t3/80", quote: "Camps, mules, permits — everything was handled. The local guides knew every shortcut and every shepherd on the route.", sortOrder: 2 },
      { name: "Arjun & Kavya", location: "Hyderabad · Signature Luxury", avatar: "https://picsum.photos/seed/t4/80", quote: "The heritage houseboat with a private chef felt unreal. They even arranged a saffron-farm visit on a random request.", sortOrder: 3 },
      { name: "Neha Kapoor", location: "Delhi · Solo, Mar 2026", avatar: "https://picsum.photos/seed/t5/80", quote: "As a solo woman traveller I got daily check-ins on WhatsApp. Felt safer in Srinagar than in my own city, honestly.", sortOrder: 4 },
    ],
  });
  console.log("✓ Testimonials");

  // ── Contact page content ──────────────────────────────────────────────────
  // Real contact details (phone/email/address/whatsapp/socials) live in
  // SiteSettings; this is the contact-page-specific copy only.
  await prisma.contactContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroBreadcrumb: "Contact Us",
      heroTitle: "We're Here When You Need Us",
      heroSubtitle:
        "Questions, custom trip requests, or just want local advice? Our team in Srinagar is ready to help you 24×7.",
      heroImage: "/hero/lidder-reiver-lg.webp",
      heroImageMobile: "/hero/lidder-river.webp",
      reachKicker: "GET IN TOUCH",
      reachTitle: "Many Ways to Reach Us",
      promiseKicker: "WE CARE ABOUT YOUR TIME",
      promiseTitle: "Our Promise to You",
      officeKicker: "VISIT OUR OFFICE",
      officeTitle: "Come Say Hello 👋",
      officeSubtitle: "We'd love to meet you in our hometown.",
      officeName: "Head Office – Srinagar",
      officeAddress:
        "Boulevard Road, Near Dal Lake, Srinagar – 190001, Jammu & Kashmir, India",
      officeHours: "Mon – Sat: 10:00 AM – 6:00 PM IST\nSunday: 10:00 AM – 2:00 PM IST",
      officeMapLabel: "Vertex Kashmir Holidays",
      officeMapSubLabel: "Boulevard Road, Srinagar",
      faqsKicker: "BEFORE YOU ASK...",
      faqsTitle: "Quick Answers",
      faqsCtaLabel: "View all FAQs",
      faqsCtaHref: "#",
      testimonialsKicker: "WHAT OUR TRAVELLERS SAY",
      testimonialsTitle: "Trusted by 12,000+ Happy Travellers",
      socialKicker: "FOLLOW OUR JOURNEY",
      socialTitle: "Stay Connected",
      socialText:
        "Travel tips, real stories, and daily updates from Kashmir. Follow us on social media.",
      socialCtaLabel: "Follow on Instagram",
      socialCtaHref: siteSocials.instagram,
      formKicker: "SEND US A MESSAGE",
      formTitle: "Let's Plan Your Kashmir Trip",
      formNote: "Prefer WhatsApp?",
      whatsappFloatText: "Chat with us",
    },
  });
  console.log("✓ ContactContent");

  await prisma.contactHeroFeature.deleteMany();
  await prisma.contactHeroFeature.createMany({
    data: [
      { title: "24×7 Support", subtitle: "Always here for you", icon: "M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2ZM8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01", sortOrder: 0 },
      { title: "Quick Response", subtitle: "Within 2 hours", icon: "M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 3", sortOrder: 1 },
      { title: "Real People", subtitle: "No bots, no wait", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0", sortOrder: 2 },
    ],
  });
  console.log("✓ ContactHeroFeatures");

  await prisma.contactPromiseItem.deleteMany();
  await prisma.contactPromiseItem.createMany({
    data: [
      { title: "Quick Response", subtitle: "We reply within 2 hours, always.", icon: "M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 3M5 3 3 5M19 3l2 2", sortOrder: 0 },
      { title: "Real Human Help", subtitle: "Talk to our local Kashmiri experts.", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0", sortOrder: 1 },
      { title: "Custom & Honest", subtitle: "No generic packages. Only what suits you.", icon: "M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9 12l2 2 4-5", sortOrder: 2 },
      { title: "Happy or We Fix", subtitle: "Your happiness is our #1 priority.", icon: "M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 9 2.5c0 4-4 7.5-9 11.5Z", sortOrder: 3 },
    ],
  });
  console.log("✓ ContactPromiseItems");

  await prisma.contactFaq.deleteMany();
  await prisma.contactFaq.createMany({
    data: [
      { question: "How soon will I get a reply?", answer: "Within 2 hours on WhatsApp and email during working hours — usually much faster.", sortOrder: 0 },
      { question: "Can you create a custom itinerary?", answer: "Absolutely. Every trip we plan is built from scratch around your dates, pace and budget.", sortOrder: 1 },
      { question: "Do you charge for itinerary planning?", answer: "No. Planning and advice are 100% free — you only pay when you book.", sortOrder: 2 },
      { question: "How do I book a trip with Vertex Kashmir?", answer: "Share your details, approve your itinerary, then lock dates with a 20% advance via Razorpay.", sortOrder: 3 },
      { question: "Is it safe to travel to Kashmir in 2026?", answer: "Yes — tourist areas are welcoming and well-connected. Our on-ground team is with you 24×7.", sortOrder: 4 },
    ],
  });
  console.log("✓ ContactFaqs");

  await prisma.contactOffice.deleteMany();
  await prisma.contactOffice.createMany({
    data: [
      { name: "Gulmarg Outpost (Seasonal)", address: "Near Gondola Phase I, Gulmarg, Jammu & Kashmir – 193403", hours: "Dec – Mar & Apr – Jun", sortOrder: 0 },
      { name: "Delhi Liaison Office", address: "Karol Bagh, New Delhi – 110005", hours: "Mon – Sat: 10 AM – 6 PM", sortOrder: 1 },
      { name: "Mumbai Liaison", address: "Andheri West, Mumbai – 400053", hours: "Mon – Sat: 10 AM – 6 PM", sortOrder: 2 },
    ],
  });
  console.log("✓ ContactOffices");

  // ── Campaign landing page ─────────────────────────────────────────────────
  const img = (seed: string, w: number, h: number) =>
    `https://picsum.photos/seed/${seed}/${w}/${h}`;

  await prisma.campaign.upsert({
    where: { slug: "gulmarg-winter-ski-week" },
    update: {},
    create: {
      slug: "gulmarg-winter-ski-week",
      published: true,
      accent: "hsl(196 90% 52%)",
      accent2: "hsl(170 80% 50%)",
      particles: "snow",
      name: "Gulmarg Winter Ski Week",
      badge: "❄️ WINTER 2027 · LIMITED DEPARTURES",
      titleHtml:
        'Learn to ski on Asia\'s <span class="grad-accent-text italic">best powder</span> — in 6 days',
      sub: "Certified instructors, all gear included, and the Gulmarg Gondola at your doorstep. Built for absolute beginners and rusty intermediates.",
      heroImage: "/hero/gulmarg-winter-lg.webp",
      heroImageMobile: "/hero/gulmarg-winter.webp",
      finalImage: img("camp-ski-final", 1800, 700),
      facts: JSON.stringify(["6D / 5N", "Gulmarg", "Beginner-friendly", "Max 12 / batch", "Jan – Mar"]),
      heroCta: "Reserve My Ski Week",
      proofCount: "2,100+",
      offerText: "🔥 Early-bird: ₹4,000 off ends",
      offerDeadline: new Date("2027-01-01T23:59:59+05:30"),
      offerSeats: "Only 12 seats per batch",
      navCta: "Reserve a Seat",
      phone: "+91 94190 00000",
      whatsappHref: "https://wa.me/919419000000",
      strip: JSON.stringify([
        "❄️ Fresh powder daily",
        "⛷️ ISIA-certified instructors",
        "🚡 Gondola at the doorstep",
        "🏨 Heated slope-side stay",
        "📸 Photographer on every batch",
        "🔒 Razorpay secured",
        "✅ J&K licensed",
      ]),
      stats: JSON.stringify([
        ["2,100", "+", "Skiers taught"],
        ["96", "%", "Stand-up rate by day 3"],
        ["4.9", "★", "Average rating"],
        ["12", "", "Max batch size"],
      ]),
      filmTitle: "Six days in Gulmarg powder",
      filmDuration: "1:48",
      filmPoster: img("film-ski", 1400, 790),
      filmSrc: "/media/ski-film.mp4",
      highlightsTitle: "Why 2,100+ people learned skiing with us",
      highlights: JSON.stringify([
        { image: img("hl-ski-school", 480, 300), emoji: "⛷️", title: "Ski School Included", description: "4 days of certified instruction — gear, lift passes, the lot." },
        { image: img("hl-gondola", 480, 300), emoji: "🚡", title: "Gondola Phase 1 & 2", description: "Ride to 3,980 m on Apharwat. Powder bowls most resorts dream of." },
        { image: img("hl-hotel", 480, 300), emoji: "🏨", title: "Slope-side Stay", description: "Cosy heated hotel 5 minutes from the beginner slopes." },
        { image: img("hl-photo", 480, 300), emoji: "📸", title: "Trip Photographer", description: "Every batch travels with a photographer. Reels included." },
      ]),
      activitiesTitle: "Activities you'll actually do",
      activities: JSON.stringify([
        { image: img("act-ski-lesson", 520, 700), title: "Daily Ski Lessons" },
        { image: img("act-gondola", 520, 700), title: "Gondola Summit Ride" },
        { image: img("act-sledge", 520, 700), title: "Sledging & Snow Games" },
        { image: img("act-bonfire", 520, 700), title: "Bonfire + Wazwan Night" },
        { image: img("act-snowshoe", 520, 700), title: "Snowshoe Forest Walk" },
        { image: img("act-igloo", 520, 700), title: "Igloo Café Visit" },
      ]),
      itineraryTitle: "Your 6 days on snow",
      itinerary: JSON.stringify([
        { title: "Arrive Srinagar → Gulmarg", description: "Airport pickup, scenic 2-hr drive, gear fitting & welcome kahwa by the bukhari.", image: img("itn-ski1", 640, 400) },
        { title: "Ski School Day 1", description: "Boots, balance and your first glides on the beginner slope. Evening snow walk.", image: img("itn-ski2", 640, 400) },
        { title: "Ski School Day 2", description: "Turning and stopping with confidence. Afternoon sledging & snowball league.", image: img("itn-ski3", 640, 400) },
        { title: "Ski School Day 3", description: "Button lift laps on longer runs. Bonfire night with live wazwan dinner.", image: img("itn-ski4", 640, 400) },
        { title: "Gondola Summit Day", description: "Phase 1 & 2 to Apharwat (3,980 m). Intermediates ski; beginners snow-play & photos.", image: img("itn-ski5", 640, 400) },
        { title: "Departure", description: "Certificate ceremony, brunch, and drop at Srinagar airport by 1 PM.", image: img("itn-ski6", 640, 400) },
      ]),
      tiers: JSON.stringify([
        { name: "Standard", price: "₹28,999", old: "₹32,999", tag: "", desc: "Shared twin rooms, full ski school", feats: ["5N heated hotel stay", "4-day ski school + gear", "All meals (B+D)", "Gondola Phase 1", "Airport transfers"] },
        { name: "Deluxe", price: "₹36,999", old: "₹40,999", tag: "MOST POPULAR", desc: "Premium stay + summit day", feats: ["Everything in Standard", "Premium hotel upgrade", "Gondola Phase 2 (summit)", "Trip photographer access", "Snowshoe walk included"] },
        { name: "Private", price: "₹54,999", old: "", tag: "SMALL GROUPS", desc: "Your own instructor & jeep", feats: ["Everything in Deluxe", "1:2 private instructor", "Private 4x4 transfers", "Flexible daily plan", "Twin-sharing or solo room"] },
      ]),
      batches: JSON.stringify([
        { date: "Jan 10 – 15, 2027", seats: 4, price: "₹28,999", status: "filling" },
        { date: "Jan 24 – 29, 2027", seats: 9, price: "₹28,999", status: "open" },
        { date: "Feb 7 – 12, 2027", seats: 0, price: "₹30,999", status: "sold" },
        { date: "Feb 21 – 26, 2027", seats: 11, price: "₹30,999", status: "open" },
        { date: "Mar 7 – 12, 2027", seats: 12, price: "₹27,999", status: "open" },
      ]),
      inclusions: JSON.stringify([
        "5 nights heated accommodation in Gulmarg",
        "4-day certified ski school with full gear",
        "Breakfast & dinner daily (veg/non-veg)",
        "Gondola tickets as per plan",
        "Srinagar airport transfers",
        "Trip lead + 24x7 on-ground support",
        "Completion certificate",
      ]),
      exclusions: JSON.stringify([
        "Flights to Srinagar",
        "Lunches & beverages",
        "Phase 2 gondola (Standard plan)",
        "Personal snow-wear purchase",
        "Travel insurance",
        "Anything not listed in inclusions",
      ]),
      galleryTitle: 'Last season looked <span class="grad-accent-text italic">like this</span>',
      gallery: JSON.stringify(
        ["gal-ski1", "gal-ski2", "gal-ski3", "gal-ski4", "gal-ski5", "gal-ski6", "gal-ski7", "gal-ski8"].map((s) =>
          img(s, 540, 380),
        ),
      ),
      testimonials: JSON.stringify([
        { image: img("t-ski1", 80, 80), name: "Tanvi R.", location: "Mumbai", quote: "Went in unable to stand on skis, came back carving turns. The instructors are saints with infinite patience." },
        { image: img("t-ski2", 80, 80), name: "Aditya & Friends", location: "Delhi", quote: "Bonfire wazwan night alone was worth the price. The batch becomes a family by day three." },
        { image: img("t-ski3", 80, 80), name: "Neeraj K.", location: "Bengaluru", quote: "Everything they promised was there — gear, passes, photographer. Zero surprise costs." },
      ]),
      faqsTitle: 'Questions, <span class="grad-accent-text italic">answered</span>',
      faqs: JSON.stringify([
        { question: "I've never skied. Is this really for me?", answer: "Yes — 80% of every batch are first-timers. Day 1 starts with how to wear boots. By day 4 you'll be doing controlled runs." },
        { question: "What fitness level do I need?", answer: "If you can climb 3 flights of stairs, you're fine. Skiing here is technique-led, not endurance-led." },
        { question: "What about clothes?", answer: "Ski jacket, pants, gloves, helmet and goggles are included. Bring thermals and woollen socks." },
        { question: "Is January too cold?", answer: "It's -5 to -12°C — but that's the best snow. Hotels are heated and the gear keeps you warm on the slopes." },
        { question: "Cancellation policy?", answer: "Free cancellation 15+ days out. Within 7–15 days your 20% advance converts to a 12-month credit." },
      ]),
      finalTitle: "The powder doesn't wait. Neither do these batches.",
      finalSub: "Lock your seat with ₹5,800 today — pay the rest a week before departure.",
      finalCta: "Reserve My Seat",
      finalNote: "Average batch sells out 6 weeks in advance.",
      metaTitle: "Gulmarg Winter Ski Week 2027 — Learn to Ski | Vertex Kashmir Holidays",
      metaDesc:
        "6-day Gulmarg ski week for beginners & intermediates — certified instructors, all gear, Gondola access and slope-side stay. Limited winter 2027 departures.",
      ogImage: img("camp-ski-hero", 1200, 630),
    },
  });
  console.log("✓ Campaign");

  // ── About page content ────────────────────────────────────────────────────
  // Title strings support mint accent markers (*text*) and \n line breaks.
  await prisma.aboutContent.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      // Hero
      heroBreadcrumb: "About Us",
      heroTitle: "Born in *Kashmir.*\nBuilt on *Trust.*",
      heroSubtitle:
        "We are locals, not just planners. We live here, we explore every day, and we design journeys we would take with our own families. Honest pricing, real experiences, unforgettable memories.",
      heroImage: "/hero/pahalgam2-lg.webp",
      heroImageMobile: "/hero/pahalgam2.webp",
      heroCtaPrimaryLabel: "Our Story",
      heroCtaPrimaryHref: "#story",
      heroCtaSecondaryLabel: "Meet the Team",
      heroCtaSecondaryHref: "#team",
      // Story
      storyKicker: "OUR STORY",
      storyTitle: "From a Small Dream\nto Thousands of Smiles",
      storyBody:
        "Vertex Kashmir Holidays began in 2010 with a single taxi and a big belief— that tourism in Kashmir can be honest, responsible, and world-class. Today, we've hosted 12,000+ travellers from 45+ countries. But we still treat every trip like it's for our own guests.",
      storyImage: "https://picsum.photos/seed/story-houseboat/900/680",
      // Stats strip
      statsImage: "https://picsum.photos/seed/stats-mtn/1400/300",
      // Values
      valuesKicker: "OUR VALUES",
      valuesTitle: "The Promises\nWe Keep",
      valuesSubtitle:
        "These aren't just words on a page. They're how we run every trip, every day.",
      // Team
      teamKicker: "OUR TEAM",
      teamTitle: "Locals. Explorers.\nPassionate Hosts.",
      teamCtaLabel: "Meet Our Full Team",
      teamCtaHref: "#",
      // Journey
      journeyKicker: "OUR JOURNEY",
      journeyTitle: "15+ Years of\nGrowing Together",
      // Press
      pressLabel: "AS FEATURED IN",
      // Final CTA
      ctaTitle: "Come as a guest,\nleave as family.",
      ctaSubtitle: "Let's plan your Kashmir story.",
      ctaImage: "https://picsum.photos/seed/cta-valley/1800/420",
      ctaWhatsappLabel: "Chat on WhatsApp",
      ctaWhatsappHref: "#",
      ctaCallLabel: "Call Us Now",
      ctaCallHref: "#",
      ctaEmailLabel: "Email Us",
      ctaEmailHref: "#",
    },
  });
  console.log("✓ AboutContent");

  await prisma.aboutStoryFeature.deleteMany();
  await prisma.aboutStoryFeature.createMany({
    data: [
      { title: "Local & Independent", subtitle: "100% locally owned and operated", icon: "M5 3h14v18H5ZM9 8h6M9 12h6M9 16h3", sortOrder: 0 },
      { title: "Trusted by Thousands", subtitle: "12,000+ happy travellers & counting", icon: "m12 3 2.2 4.6 5 .7-3.6 3.5.9 5L12 14.5 7.5 16.8l.9-5L4.8 8.3l5-.7ZM12 17v4", sortOrder: 1 },
      { title: "Best Price Promise", subtitle: "No hidden costs. Ever.", icon: "M12 9a6 6 0 1 0 0-12 6 6 0 0 0 0 12M9 14l-1.5 7L12 18.5 16.5 21 15 14", sortOrder: 2 },
      { title: "24×7 On-ground", subtitle: "Support always with you", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0", sortOrder: 3 },
    ],
  });
  console.log("✓ AboutStoryFeatures");

  await prisma.aboutStat.deleteMany();
  await prisma.aboutStat.createMany({
    data: [
      { value: "12,000+", label: "Happy Travellers", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0", sortOrder: 0 },
      { value: "500+", label: "Curated Trips", icon: "M3 11h18l-2 8H5ZM8 11V7a4 4 0 0 1 8 0v4", sortOrder: 1 },
      { value: "4.9 / 5", label: "Average Rating", icon: "m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z", sortOrder: 2 },
      { value: "45+", label: "Countries", icon: "M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18", sortOrder: 3 },
      { value: "15+", label: "Years of Experience", icon: "M3 4h18v18H3ZM16 2v4M8 2v4M3 10h18", sortOrder: 4 },
    ],
  });
  console.log("✓ AboutStats");

  await prisma.aboutValue.deleteMany();
  await prisma.aboutValue.createMany({
    data: [
      { title: "Honest & Transparent", subtitle: "Clear itineraries, clear pricing, no last-minute surprises.", icon: "M19 14a7 7 0 1 0-14 0M12 14v-3M3 18c3 1.5 6 2 9 2s6-.5 9-2M12 7a2.5 2.5 0 0 1 2.5 2.5", sortOrder: 0 },
      { title: "Responsible Tourism", subtitle: "We protect our mountains, lakes, and local communities.", icon: "M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 5 2 8 6 8 10a7 7 0 0 1-7 7M12 22v-8M9 12l3 2 3-2", sortOrder: 1 },
      { title: "Quality Experiences", subtitle: "Hand-picked stays, verified drivers, and thoughtful touches.", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0M17 4l1 1 2-2", sortOrder: 2 },
      { title: "Here When You Need Us", subtitle: "Real people. Real support. Anytime, anywhere.", icon: "M3 12a9 9 0 1 1 18 0v5a2 2 0 0 1-2 2h-3v-6h5M3 12v5a2 2 0 0 0 2 2h3v-6H3", sortOrder: 3 },
    ],
  });
  console.log("✓ AboutValues");

  await prisma.teamMember.deleteMany();
  await prisma.teamMember.createMany({
    data: [
      { name: "Aamir Lone", role: "Founder & CEO", bio: "Born and raised in Srinagar. Loves mountain roads and strong kahwa.", image: "https://picsum.photos/seed/tm-aamir/360/300", sortOrder: 0 },
      { name: "Sara Rashid", role: "Trip Designer", bio: "Curates experiences that feel personal and beautiful.", image: "https://picsum.photos/seed/tm-sara/360/300", sortOrder: 1 },
      { name: "Faisal Ahmad", role: "Head of Operations", bio: "Ensures every trip runs like clockwork.", image: "https://picsum.photos/seed/tm-faisal/360/300", sortOrder: 2 },
      { name: "Iqra Hamid", role: "Guest Experience", bio: "Your first call, your best friend in Kashmir.", image: "https://picsum.photos/seed/tm-iqra/360/300", sortOrder: 3 },
      { name: "Rahil Mir", role: "On-ground Lead", bio: "Mountains are his office, guests are his family.", image: "https://picsum.photos/seed/tm-rahil/360/300", sortOrder: 4 },
    ],
  });
  console.log("✓ TeamMembers");

  await prisma.journeyMilestone.deleteMany();
  await prisma.journeyMilestone.createMany({
    data: [
      { year: "2010", detail: "Started with a single taxi in Srinagar.", icon: "M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 5 2 8 6 8 10a7 7 0 0 1-7 7M12 22v-8", sortOrder: 0 },
      { year: "2012", detail: "First 100+ guests and our first team members.", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9", sortOrder: 1 },
      { year: "2015", detail: "5000+ travellers and 100+ curated itineraries.", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2v3M12 19v3M2 12h3M19 12h3", sortOrder: 2 },
      { year: "2018", detail: "Guests from 30+ countries joined us.", icon: "M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18", sortOrder: 3 },
      { year: "2021", detail: "4.9★ average rating across all platforms.", icon: "m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z", sortOrder: 4 },
      { year: "2024", detail: "12,000+ travellers. Still just getting started.", icon: "m3 20 6-12 4 7 3-4 5 9Z", sortOrder: 5 },
    ],
  });
  console.log("✓ JourneyMilestones");

  await prisma.pressLogo.deleteMany();
  await prisma.pressLogo.createMany({
    data: [
      '<span className="text-[15px] leading-none"><span className="block text-[9px] font-semibold tracking-wide">Outlook</span><span className="font-extrabold lowercase tracking-tight" style={{fontSize: "19px"}}>traveller</span></span>',
      '<span className="text-[18px] font-extrabold lowercase tracking-tight">lonely <span className="font-semibold">planet</span></span>',
      '<span className="flex items-center gap-1.5 text-[17px] font-extrabold tracking-tight"><span className="grid h-5 w-5 place-items-center rounded-full border-2 border-current text-[9px]">◉</span>Tripadvisor</span>',
      '<span className="font-display text-[17px] font-semibold tracking-[0.18em]">JKTDC</span>',
      '<span className="text-[17px] font-bold tracking-tight">Make<span className="font-extrabold">My</span>Trip</span>',
      '<span className="font-display text-[15px] font-bold uppercase leading-tight">The Times<br/>of India</span>',
      '<span className="font-display text-[19px] font-bold leading-none">Forbes<span className="block text-right text-[8px] font-sans font-semibold tracking-[0.3em]">INDIA</span></span>',
    ].map((html, i) => ({ html, sortOrder: i })),
  });
  console.log("✓ PressLogos");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
