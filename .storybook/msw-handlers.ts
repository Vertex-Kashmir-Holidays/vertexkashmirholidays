import { http, HttpResponse } from "msw";

// Matches the real response shape of GET /api/galleries (src/app/api/galleries/route.ts):
// { items: GalleryAsset[], total: number, page: number, pages: number }
const sampleItems = [
  {
    id: "g1",
    url: "/brand/placeholders/svg/avatar-blue.svg",
    publicId: null,
    type: "IMAGE",
    alt: "Dal Lake houseboat",
    category: "gallery",
  },
  {
    id: "g2",
    url: "/brand/placeholders/svg/avatar-green.svg",
    publicId: null,
    type: "IMAGE",
    alt: "Gulmarg gondola",
    category: "gallery",
  },
  {
    id: "g3",
    url: "/brand/placeholders/svg/avatar-navy.svg",
    publicId: null,
    type: "IMAGE",
    alt: "Pahalgam valley",
    category: "gallery",
  },
];

export const mswHandlers = {
  galleries: [
    http.get("/api/galleries", () =>
      HttpResponse.json({ items: sampleItems, total: sampleItems.length, page: 1, pages: 1 }),
    ),
  ],
  galleriesEmpty: [
    http.get("/api/galleries", () =>
      HttpResponse.json({ items: [], total: 0, page: 1, pages: 1 }),
    ),
  ],
  galleriesError: [
    http.get("/api/galleries", () => HttpResponse.json({ error: "Server error" }, { status: 500 })),
  ],
};
