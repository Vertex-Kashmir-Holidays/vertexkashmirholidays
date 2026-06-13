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

  // ── SiteSettings ────────────────────────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "Vertex Kashmir Holidays",
      siteTagline: "While the plains scorch, Kashmir is calling.",
      siteEmail: "hello@vertexkashmirholidays.com",
      sitePhone: "+91 94190 00000",
      siteAddress: "Residency Road, Srinagar, Jammu & Kashmir 190001",
      whatsapp: "+919419000000",
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
      { image: "/hero/hero.webp", alt: "Kashmir valley panorama", sortOrder: 0 },
      { image: "/hero/gulmarg.webp", alt: "Gulmarg meadows", sortOrder: 1 },
      { image: "/hero/srinagar.webp", alt: "Srinagar and Dal Lake", sortOrder: 2 },
      { image: "/hero/pahalgam.webp", alt: "Pahalgam valley", sortOrder: 3 },
      { image: "/hero/sonamarg.webp", alt: "Sonamarg meadows", sortOrder: 4 },
      { image: "/hero/gurez.webp", alt: "Gurez valley", sortOrder: 5 },
      { image: "/hero/shikara.webp", alt: "Shikara on Dal Lake", sortOrder: 6 },
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

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
