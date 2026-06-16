import { ItineraryData } from "@/types/itinerary";

// Stable ids for the seed document. New rows added in the editor get runtime ids
// via genId(); these fixed ids keep the default deterministic.
export const DEFAULT_ITINERARY_DATA: ItineraryData = {
  coverTitle: "KASHMIR",
  subtitle: "Escape",
  duration: "5 NIGHTS · 6 DAYS",
  preparedFor: "Mr Farooq Sheikh",
  travelDates: "10 - 15 JUNE 2026",
  travelers: "2 ADULTS · 1 CHILD",
  packageType: "PREMIUM PACKAGE",
  totalCost: "Rs 30,500/-",
  coverImage: "/itinerary/hero.webp",

  destinations: "Srinagar · Pahalgam · Gulmarg · Sonamarg",

  info: [
    { id: "info-1", label: "Duration", value: "5 Nights / 6 Days", icon: "calendar" },
    { id: "info-2", label: "To be explored", value: "4 Destinations", icon: "map-pin" },
    { id: "info-3", label: "For transfers & sightseeing", value: "Private Vehicle", icon: "car" },
    { id: "info-4", label: "Handpicked for you", value: "Premium Experience", icon: "star" },
  ],

  days: [
    {
      id: "day-1",
      title: "Arrival in Srinagar",
      image: "/itinerary/srinagar.webp",
      body: "Welcome to Kashmir! Meet our representative at the airport and transfer to your hotel. After check-in, enjoy sightseeing of Mughal Gardens including Shalimar Bagh, Nishat Bagh, and Cheshmashahi. Visit Shankaracharya Temple and Hazratbal Dargah. Evening free to explore Dal Lake.",
      meta: [
        { id: "m-1", label: "Meals", value: "Dinner" },
        { id: "m-2", label: "Stay", value: "Srinagar" },
        { id: "m-3", label: "Highlights", value: "Mughal Gardens, Dal Lake" },
      ],
    },
    {
      id: "day-2",
      title: "Gulmarg Excursion",
      image: "/itinerary/gulmarg.webp",
      body: "After breakfast, drive to Gulmarg (Meadow of Flowers). Enjoy the scenic drive and explore Gulmarg's natural beauty. Take the Gondola cable car ride (subject to operation), enjoy horse riding to Strawberry Valley. Return to Srinagar for overnight stay.",
      meta: [
        { id: "m-4", label: "Meals", value: "Breakfast & Dinner" },
        { id: "m-5", label: "Stay", value: "Srinagar" },
        { id: "m-6", label: "Highlights", value: "Gondola Ride, Strawberry Valley" },
      ],
    },
    {
      id: "day-3",
      title: "Sonamarg Day Trip",
      image: "/itinerary/sonamarg.webp",
      body: "Proceed to Sonamarg (Meadow of Gold), known for its stunning natural beauty, alpine flowers, and snow-capped mountains. Enjoy the breathtaking views and serene atmosphere. Return to Srinagar for overnight stay.",
      meta: [
        { id: "m-7", label: "Meals", value: "Breakfast & Dinner" },
        { id: "m-8", label: "Stay", value: "Srinagar" },
        { id: "m-9", label: "Highlights", value: "Thajiwas Glacier, Scenic Views" },
      ],
    },
    {
      id: "day-4",
      title: "Pahalgam Valley",
      image: "/itinerary/pahalgam.webp",
      body: "Check out from hotel and drive to Pahalgam (Valley of Shepherds). Visit Lidder stream, enjoy pony rides along the trails. Explore Aru Valley and Betaab Valley with their beautiful campsites. Overnight stay in Pahalgam.",
      meta: [
        { id: "m-10", label: "Meals", value: "Breakfast & Dinner" },
        { id: "m-11", label: "Stay", value: "Pahalgam" },
        { id: "m-12", label: "Highlights", value: "Lidder Stream, Aru Valley" },
      ],
    },
    {
      id: "day-5",
      title: "Return to Srinagar & Local Sightseeing",
      image: "/itinerary/shikara.webp",
      body: "Drive back to Srinagar. After check-in, enjoy local shopping and visit Pari Mahal, Chashme Shahi and Nishat Bagh. Evening free for leisure or Shikara ride (optional).",
      meta: [
        { id: "m-13", label: "Meals", value: "Breakfast & Dinner" },
        { id: "m-14", label: "Stay", value: "Srinagar" },
        { id: "m-15", label: "Highlights", value: "Pari Mahal, Shikara Ride" },
      ],
    },
    {
      id: "day-6",
      title: "Departure",
      image: "/itinerary/lidder-river.webp",
      body: "Check out from hotel and drive to the airport with beautiful memories of your Kashmir trip.",
      meta: [
        { id: "m-16", label: "Meals", value: "Breakfast" },
        { id: "m-17", label: "Drop", value: "Srinagar Airport" },
      ],
    },
  ],

  hotels: [
    { id: "h-1", destination: "Srinagar (3N)", hotelDetails: "Hotel Grand MS / Hotel Royal Heritage / Similar", nights: "3", roomType: "Double Sharing" },
    { id: "h-2", destination: "Gulmarg (1N)", hotelDetails: "Hotel Grand Hill View / Hotel Welcome Resort / Similar", nights: "1", roomType: "Double Sharing" },
    { id: "h-3", destination: "Pahalgam (1N)", hotelDetails: "Hotel Pahalgam / Similar", nights: "1", roomType: "Double Sharing" },
  ],

  trust: [
    { id: "t-1", title: "Handpicked Hotels", subtitle: "Comfortable & Well Located", icon: "home" },
    { id: "t-2", title: "Verified Properties", subtitle: "Trusted by 1000+ Travellers", icon: "shield" },
    { id: "t-3", title: "Best Price Guarantee", subtitle: "Value for Money Always", icon: "medal" },
    { id: "t-4", title: "24/7 Support", subtitle: "We're here for you Always", icon: "support" },
  ],

  transportType: "Sedan",
  transportDesc: "Private Vehicle for the entire trip",
  transportImage: "/itinerary/gurez.webp",

  inc: [
    "Accommodation in well-appointed hotels",
    "Daily breakfast and dinner",
    "All transfers and sightseeing by private vehicle",
    "Driver allowance, fuel, parking & toll charges",
    "All applicable hotel taxes",
    "04 Nights / 05 Days accommodation in Deluxe Rooms",
    "1 hour Shikara ride on Dal Lake",
    "Honeymoon specials (room decoration, cake, flower bedding)",
    "24/7 customer support",
  ],

  exc: [
    "Airfare / Train fare",
    "Personal expenses such as laundry, tips, and phone calls",
    "Entry fees to monuments, gardens, and attractions",
    "Any meals not mentioned in the inclusions",
    "Anything not specifically mentioned under inclusions",
    "Cable car tickets (Gulmarg Gondola)",
    "Horse riding charges",
    "Guide charges",
    "Pony rides in Pahalgam",
    "Travel insurance",
  ],

  pay: [
    "20% advance payment for confirmation",
    "Balance 80% payable upon arrival",
    "No transaction fees for bank transfers & UPI",
    "Credit/debit card payments attract additional charges upto 5% or more",
    "Policy may change during peak seasons",
  ],

  cancel: [
    "Cancellation must be requested via email",
    "Minimum 5 working days notice required",
    "Cancelling before 1 month: 10% processing fee; 15-29 days: 25%; 7-14 days: 50%; within 7 days: 75%",
    "No refund for no-shows or mid-tour cancellations",
    "Unused services are non-refundable",
    "Refunds processed within 15 working days",
  ],
};
