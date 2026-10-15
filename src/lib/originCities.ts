// Editorial config for the "Kashmir Tour Packages from [City]" SEO landing
// pages (/tours/kashmir-tour-packages-from/[city]). Deliberately holds only
// naming/marketing copy — factual flight/train information lives in
// @/lib/transport/data (single source of truth, see that file's header for
// why) and is looked up by city slug at render time, not duplicated here.
export interface OriginCity {
  slug: string;
  /** Display name used in copy/headings. */
  name: string;
  /** Only set when the common search term differs from the display name
   *  (e.g. Bengaluru/Bangalore) — used once in the intro for clarity. */
  akaName?: string;
  metaDescription: string;
  /** <title> text, before the " | Vertex Kashmir Holidays" suffix — keep it
   *  ≤34 characters or the 60-character cap drops the suffix. */
  metaTitle: string;
  /** The hero's line under the H1. */
  heroSubtitle: string;
  /** Under "Travelling to Kashmir from {City}", above the Air/Train cards.
   *  No flight/train facts here — those live only in @/lib/transport/data. */
  introParagraph: string;
  /** 3–4 bullets. */
  whyFromThisCity: string[];
  /** 1–3 sentences. */
  bestTimeNote: string;
  /** 4–6, shown after the two route FAQs generated from @/lib/transport/data. */
  faqs: OriginCityFaq[];
}

export interface OriginCityFaq {
  question: string;
  answer: string;
}

export const ORIGIN_CITIES: OriginCity[] = [
  {
    slug: "mumbai",
    name: "Mumbai",
    metaTitle: "Kashmir Packages from Mumbai",
    metaDescription:
      "Kashmir tour packages from Mumbai — honeymoon, family and premium trips with transparent pricing. See what's included, then get a personalised quote.",
    heroSubtitle:
      "From Mumbai, Kashmir is a proper holiday rather than a weekend away — which is why most of our Mumbai guests take six or seven nights and see the whole valley properly.",
    introParagraph:
      "Mumbai travellers plan Kashmir differently from Delhi ones, and they should. Coming this far, a three-night trip is not worth the journey — the travellers who enjoy it most take six or seven nights and cover Srinagar, Gulmarg, Pahalgam and Sonamarg without rushing any of them. Mumbai is also where we see the most honeymoon bookings, often planned well ahead, which is an advantage: the best boutique properties in Gulmarg and Pahalgam are limited and fill early.",
    whyFromThisCity: [
      "Make the distance worth it: six or seven nights is the sweet spot from Mumbai. Our Premium and Honeymoon packages are built at that length for exactly this reason.",
      "Plan early, stay better: Mumbai guests tend to book further ahead, which means the better boutique properties in Gulmarg and Pahalgam are still available.",
      "A real change of climate: Mumbai's humidity and Kashmir's dry mountain air are about as different as India gets. Autumn and winter feel especially unfamiliar in the best way.",
      "Snow that most Mumbaikars have never seen: for a lot of our guests from here, Gulmarg in January is the first time they have stood in real snow.",
    ],
    bestTimeNote:
      "March to June suits most Mumbai travellers — tulips in early spring, then comfortable summer weather while Mumbai gets humid. December to February is the trip to take if you want snow, and worth the longer journey precisely because it is so unlike home.",
    faqs: [
      {
        question: "How many nights should we plan from Mumbai?",
        answer:
          "Six or seven. Coming this far for three or four nights means spending a disproportionate share of your trip travelling. Our Premium package is 6 nights across five places, and the Honeymoon tour is 6 nights at a slower pace. If you only have five, the Family or Group packages work.",
      },
      {
        question: "We're planning a honeymoon — when should we book?",
        answer:
          "As early as you can, and from Mumbai that is usually possible. Boutique properties in Gulmarg and Pahalgam are limited in number and the good ones fill months ahead, particularly for December, January and the spring season. Tell us your dates and we will confirm what is actually available before you pay anything.",
      },
      {
        question: "Do your prices include travel from Mumbai?",
        answer:
          "No. Every price on this site covers your Kashmir stay and ground experience. We arrange travel from Mumbai separately on request, at actual fare with no markup. Keeping them separate means you can see exactly what the Kashmir portion costs rather than having it buried in one number.",
      },
      {
        question: "Is Kashmir suitable for someone who has never seen snow?",
        answer:
          "Very. Gulmarg between December and February is deep under snow, and we would honestly suggest two nights there rather than one, so you have a full day in it rather than an afternoon. Bring proper waterproof shoes — most first-time snow visitors underestimate this and regret it.",
      },
      {
        question: "We're travelling with elderly parents. Is the trip manageable?",
        answer:
          "Yes, with the right package. Our Family and Premium tours stay overnight in Gulmarg and Pahalgam rather than doing long day trips, which keeps daily driving under three hours. Tell us ages and mobility when you enquire and we will be honest about what suits them.",
      },
    ],
  },
  {
    slug: "delhi",
    name: "Delhi",
    metaTitle: "Kashmir Packages from Delhi",
    metaDescription:
      "Kashmir tour packages from Delhi — the closest major city to the valley. Compare honeymoon, family and group trips, then get a personalised quote.",
    heroSubtitle:
      "Delhi is the closest major city to Kashmir, which makes a short valley break genuinely possible — and the easiest place to come from if your dates are flexible.",
    introParagraph:
      "More of our travellers come from Delhi than anywhere else, and the reason is simple proximity. From here Kashmir is a short hop rather than an expedition, which means a four or five night trip actually makes sense — you are not spending two of your days getting there and back. It also means Delhi travellers have the most freedom to move their dates if weather closes a road, which matters more in winter than people expect.",
    whyFromThisCity: [
      "Short enough for a long weekend: Delhi is the only metro from which a 4-night Kashmir trip doesn't feel rushed, because travel time barely eats into your holiday.",
      "Easiest dates to change: if snow closes the Gulmarg road or fog delays a flight, re-booking from Delhi costs you far less than from the south.",
      "The escape is real: Delhi summers run above 40°C while Srinagar sits in the twenties. For a lot of our Delhi guests, that temperature gap is the whole point of the trip.",
      "Winter without the long haul: December to February is when Kashmir is at its most striking, and Delhi is close enough to come for the snow and go home within a week.",
    ],
    bestTimeNote:
      "April to June is the most popular window with Delhi travellers, because it lines up with school holidays and with the worst of the plains heat. December to February is the better choice if you want snow, and from Delhi it is an easy enough trip that a short winter break works.",
    faqs: [
      {
        question: "Is four or five nights enough for Kashmir from Delhi?",
        answer:
          "Yes, and from Delhi it is the one place it genuinely works. Five nights covers Srinagar, Gulmarg and Pahalgam at a sensible pace. Four is tight but possible if you drop one destination. Our Budget and Group packages are 5 nights; the Premium and Vaishno Devi tours run to 6.",
      },
      {
        question: "We want to leave Delhi in peak summer — is Kashmir actually cooler?",
        answer:
          "Considerably. While Delhi is in the forties, Srinagar sits in the twenties, Pahalgam is cooler still, and Gulmarg at 8,700 feet needs a light jacket even in June. This is the single most common reason our Delhi guests travel in May and June.",
      },
      {
        question: "Can you arrange our travel from Delhi as well as the Kashmir portion?",
        answer:
          "Yes. Tell us your dates and we will check real options and share them on WhatsApp. We arrange them at actual fare with no markup — the package price on this page covers your Kashmir stay and ground experience only, and we keep the two separate so you can see exactly what you are paying for.",
      },
      {
        question: "Is it worth coming from Delhi just for the snow?",
        answer:
          "Many people do. Gulmarg is reliably under snow from late December through February, the Gondola runs most of the winter, and Delhi is close enough that a short winter break makes sense. Our Gulmarg Snow & Ski package is built for exactly this — three nights, two of them in Gulmarg itself.",
      },
      {
        question: "What if the weather disrupts our trip?",
        answer:
          "Winter snowfall can close the Gulmarg road or delay flights for a day. Our office is at Reram, Tangmarg, on the Gulmarg road, so we know the position early. If a day is lost we rearrange the itinerary, and where a hotel or service goes unused we refund it. From Delhi, shifting your return by a day is usually straightforward.",
      },
    ],
  },
  {
    slug: "bangalore",
    name: "Bengaluru",
    akaName: "Bangalore",
    metaTitle: "Kashmir from Bengaluru",
    metaDescription:
      "Kashmir tour packages from Bengaluru — family, honeymoon and premium trips. Transparent pricing, local Kashmir team. See what's included and get a quote.",
    heroSubtitle:
      "Bengaluru is about as far from Kashmir as India gets, so the trips that work best from here are the longer ones — six or seven nights, properly paced.",
    introParagraph:
      "Bengaluru is one of the longest journeys to Kashmir in the country, and that shapes what a good trip looks like from here. Short itineraries do not make sense; six or seven nights does. The upside is that Bengaluru travellers tend to be comparing carefully rather than booking on impulse, which suits how we work — everything on this site lists what is included and what is not, with real amounts, because a trip this far should not come with surprises at the Pahalgam taxi stand.",
    whyFromThisCity: [
      "Go long or don't go: six or seven nights is what makes the journey worthwhile. Our Premium package covers five places in six nights without a rushed day.",
      "Nothing like home: Bengaluru's mild, even climate makes Kashmir's seasons feel genuinely dramatic — snow in January, chinars in October, tulips in April.",
      "Worth comparing properly: every package here lists its inclusions and exclusions with real figures. Compare ours against any quote you have; the gap is usually in what happens on the ground.",
      "Plan it once, properly: coming this far, you want the ground side handled — transfers, union cabs, hotel taxes. That is what our packages cover.",
    ],
    bestTimeNote:
      "Because the journey is long, we would suggest choosing your season deliberately rather than by convenience. April for tulips, September and October for autumn colour, and late December to February for snow. Each is a completely different trip and worth the distance for different reasons.",
    faqs: [
      {
        question: "Is Kashmir worth it from this far south?",
        answer:
          "If you go for long enough, yes. We would not recommend a three or four night trip from Bengaluru — you would spend too much of it travelling. Six or seven nights gives you Srinagar, Gulmarg, Pahalgam and Sonamarg at a pace that justifies the distance.",
      },
      {
        question: "Which package suits a first trip from Bengaluru?",
        answer:
          "Our Premium 6-night tour, in most cases. It covers five places with an overnight in each rather than day trips, which means your long journey is not followed by a week of early starts. The Family package is the better fit if you are travelling with children or elderly parents.",
      },
      {
        question: "How do I compare your prices against other quotes?",
        answer:
          "Look at the exclusions, not the headline. Ours lists every ground cost we do not cover with real figures — gondola, pony rates, union cabs where they apply. Most Kashmir quotes leave these out and collect them on the ground. Compare total cost, not package cost, and the gap usually closes.",
      },
      {
        question: "What is the weather actually like compared to Bengaluru?",
        answer:
          "Entirely different. Bengaluru stays mild year-round; Kashmir has four distinct seasons. Winter in Gulmarg is below freezing for most of the day, summer in Srinagar is in the twenties, and autumn nights are cold. Whatever you own for Bengaluru weather will not be enough — plan warm layers.",
      },
      {
        question: "We're a group of friends. Does that change anything?",
        answer:
          "It changes the price in your favour. Our Group package is built for seven or more and brings the per-person cost down considerably, with shared deluxe hotels and the Pahalgam union cab pre-paid. For smaller groups of four to six, the Family or Budget packages are usually the better maths.",
      },
    ],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    metaTitle: "Kashmir Packages from Hyderabad",
    metaDescription:
      "Kashmir tour packages from Hyderabad — family, group and premium trips with clear inclusions. Local Kashmir team, transparent pricing, free quote.",
    heroSubtitle:
      "Most of our Hyderabad guests travel as families or larger groups — and those are the trips where getting the ground arrangements right makes the biggest difference.",
    introParagraph:
      "Hyderabad sends us more family and group bookings than solo or couple ones, and that shapes the advice worth giving. Larger groups have more to lose from a badly organised trip: one union cab negotiation gone wrong, one hotel that cannot seat everyone together, and the whole day changes. The packages below are built so the ground side is already settled before you land — transfers, hotel taxes, and where applicable the Pahalgam union cab.",
    whyFromThisCity: [
      "Built for groups: our Group package is priced for seven or more and includes the Pahalgam union cab pre-paid, so nobody is negotiating at a taxi stand with ten people waiting.",
      "Families travel better overnight: the Family and Premium tours stay in Gulmarg and Pahalgam rather than driving back to Srinagar each evening, which keeps daily travel under three hours.",
      "A pilgrimage option: our Vaishno Devi package combines Katra with the Kashmir valley, which suits families wanting both in one trip.",
      "Everything priced before you arrive: inclusions and exclusions are listed with real figures, so the person organising for the group is not fielding surprise costs on the road.",
    ],
    bestTimeNote:
      "April to June works best for families travelling in school holidays, and the temperature difference from Hyderabad is at its most welcome then. October brings autumn colour with fewer crowds. December to February is for snow, though with young children the cold is worth planning for properly.",
    faqs: [
      {
        question: "We're travelling as a large family group. Which package?",
        answer:
          "If there are seven or more of you, the Group package is priced for exactly that, with shared deluxe hotels, a vehicle sized for the group, and the Pahalgam union cab included. For three to six people, the Family package is the better fit — it stays overnight in Gulmarg and Pahalgam rather than running day trips.",
      },
      {
        question: "Can we combine Vaishno Devi with Kashmir?",
        answer:
          "Yes — our Vaishno Devi package does exactly that over seven days. Note that you fly into Jammu and out of Srinagar, two different cities, so book your travel accordingly. It is the most common mistake people make with this itinerary.",
      },
      {
        question: "Is this suitable for elderly parents and young children together?",
        answer:
          "The Family and Vaishno Devi packages are built for mixed-age groups. Daily driving stays short because you sleep in the resort towns, and the Vaishno Devi darshan can be done by helicopter or pony rather than on foot. Tell us ages and mobility and we will advise honestly.",
      },
      {
        question: "What ground costs should we budget beyond the package?",
        answer:
          "Each tour page has a full budget breakdown with real figures — lunches, gondola tickets, pony rides, entry fees and shopping. Broadly, allow ₹10,000 to ₹25,000 per person beyond the package depending on which tour you choose. We would rather you knew now than discovered it there.",
      },
      {
        question: "Do you provide a GST invoice?",
        answer:
          "Yes. We are registered with J&K Tourism and GST registered, and a proper invoice is available for any booking. If you need it in a company name for a corporate or group trip, tell us when you book rather than afterwards.",
      },
    ],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    metaTitle: "Kashmir Packages from Kolkata",
    metaDescription:
      "Kashmir tour packages from Kolkata — family, honeymoon and group trips with transparent pricing and a local Kashmir team. See inclusions and get a quote.",
    heroSubtitle:
      "Kolkata travellers tend to come in autumn, and they are right to — October in Kashmir is the season most people photograph and fewest people plan for.",
    introParagraph:
      "Kolkata has a particular relationship with Kashmir, and autumn is where it shows. The weeks around Durga Puja fall almost exactly when the chinars turn gold around Dal Lake and the Mughal Gardens — the valley's best-looking fortnight of the year, and one that most of the country overlooks in favour of summer. If your dates are flexible, that is the window we would point you at. Travellers from Kolkata also tend to plan around the festival break, which means booking earlier than most.",
    whyFromThisCity: [
      "Autumn is your advantage: the Durga Puja break coincides with Kashmir's chinar season, when the valley is at its most photogenic and far less crowded than summer.",
      "The festival window fills early: if you are travelling around Puja, book well ahead — those weeks are busy with travellers from the east and the better properties go first.",
      "A genuine change of season: Kolkata has no real winter. Kashmir between December and February is as different from home as anywhere in India gets.",
      "Longer trips work better: six or seven nights makes the journey worth it. Our Premium and Honeymoon packages are built at that length.",
    ],
    bestTimeNote:
      "Late September to early November is the window we would recommend first from Kolkata — golden chinars, clear skies, cool but not freezing, and it fits the festival break. December to February is the alternative if you want snow rather than autumn colour.",
    faqs: [
      {
        question: "Is autumn really the best time to visit from Kolkata?",
        answer:
          "We think so, and it happens to fit the Puja break. Late September to early November is when the chinars turn gold around Dal Lake and the Mughal Gardens, skies are clear, and the valley is far quieter than in summer. It is Kashmir's best-looking season and the least planned-for.",
      },
      {
        question: "We're travelling during the Puja holidays. Should we book early?",
        answer:
          "Yes, earlier than you might expect. Those weeks draw a lot of travellers from the east, and the better hotels in Srinagar, Gulmarg and Pahalgam fill well ahead. Tell us your dates as soon as you have them and we will confirm what is genuinely available before you commit.",
      },
      {
        question: "How many nights should we plan?",
        answer:
          "Six or seven gives you the valley properly — Srinagar, Gulmarg, Pahalgam and Sonamarg without a rushed day. Five works if you are happy to drop one destination. Our Premium tour is 6 nights across five places, and the Family and Group packages are 5 nights.",
      },
      {
        question: "Is travel from Kolkata arranged by you?",
        answer:
          "We can arrange it on request, at actual fare with no markup. The package prices on this page cover your Kashmir stay and ground experience only. Keeping them separate means you can see exactly what you are paying for rather than having travel buried inside a single figure.",
      },
      {
        question: "What will the weather feel like coming from Kolkata?",
        answer:
          "Colder than you are used to, in every season. Kolkata has no real winter; Kashmir has a severe one. Even in October, nights in Pahalgam and Gulmarg drop close to freezing. If you are travelling between December and February, you will need thermals and a proper waterproof jacket, not just a sweater.",
      },
    ],
  },
];

export function getOriginCityBySlug(slug: string): OriginCity | undefined {
  return ORIGIN_CITIES.find((c) => c.slug === slug);
}
