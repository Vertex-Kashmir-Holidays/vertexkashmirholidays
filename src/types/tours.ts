// Serializable shapes passed from the tours page (server) to its client sections.

import type { HomeTourData } from './home';

export interface TourListItemData extends HomeTourData {
  category: string; // TourCategory enum value: HONEYMOON | FAMILY | ADVENTURE | LUXURY
  durationDays: number;
}

export type TourSortOption = 'popular' | 'price-asc' | 'price-desc' | 'rating';

export interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
  count: number;
}

export interface DurationOption {
  id: string;
  label: string;
  count: number;
}
