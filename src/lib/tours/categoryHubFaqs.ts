export interface TourCategoryHubFaqItem {
  question: string;
  answer: string;
}

// Static FAQ content for the /tours/category hub — there's no CMS entity for
// a category-hub page, so these live here rather than the DB-backed Faq
// module (see getFaqsForPlacement). Kept in a plain module (not the 'use
// client' TourCategoryHubFaq component) so the server-rendered page can
// import it directly for buildFAQPage's JSON-LD without crossing the RSC
// client boundary.
export const TOUR_CATEGORY_HUB_FAQS: TourCategoryHubFaqItem[] = [
  {
    question: "Which Kashmir package is best for honeymoon?",
    answer:
      "Our Honeymoon Packages are built specifically for couples — houseboat stays on Dal Lake, private transport and a slower pace with more time in Gulmarg and Pahalgam. They're the best starting point if you're planning a honeymoon or anniversary trip.",
  },
  {
    question: "Which Kashmir package is suitable for families?",
    answer:
      "Family Tour Packages are designed with children and senior travellers in mind — shorter drive days, family-friendly hotels and a relaxed itinerary. If you're travelling with kids or grandparents, start there.",
  },
  {
    question: "What is included in Kashmir tour packages?",
    answer:
      "Most packages include hotel stays, private airport transfers, sightseeing by private vehicle, and a dedicated local coordinator. Exact inclusions vary by package and are listed on each tour's detail page before you book.",
  },
  {
    question: "Can I customize my Kashmir package?",
    answer:
      "Yes. Every package on this site can be adjusted — swap hotels, add or remove days, or combine destinations from different categories. Tell us what you have in mind and our team will tailor the itinerary.",
  },
  {
    question: "Can I add flights to my package?",
    answer:
      "Flights aren't included in the package price by default since fares change daily, but our team can help you find and time flights to Srinagar around your itinerary — just mention it when you enquire.",
  },
];
