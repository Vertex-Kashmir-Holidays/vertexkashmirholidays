// Serializable shapes mirroring the JSON stored in the matching
// `Destination.<field>` string columns (parsed/serialized via
// src/lib/destinations/content.ts). Keeping the types here means the admin
// form and the public page agree on one shape — same convention as
// src/types/tours.ts.

export interface TopAttraction {
  name: string;
  description: string;
}

export interface FoodOrShopEntry {
  name: string;
  description: string;
}
