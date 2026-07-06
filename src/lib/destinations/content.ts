// Centralized parse/serialize helpers for the string-encoded JSON columns on
// Destination. Reuses the generic parseJson<T> already defined for Tour
// instead of duplicating it — same convention as src/lib/tours/content.ts.
import { parseJson, stringifyList } from "@/lib/tours/content";
import type { TopAttraction, FoodOrShopEntry } from "@/types/destinations";

export const parseStringList = (raw: string | null | undefined): string[] =>
  parseJson<string[]>(raw, []);

export const parseTopAttractions = (raw: string | null | undefined): TopAttraction[] =>
  parseJson<TopAttraction[]>(raw, []);

export const parseFoodOrShop = (raw: string | null | undefined): FoodOrShopEntry[] =>
  parseJson<FoodOrShopEntry[]>(raw, []);

export const parseIdList = (raw: string | null | undefined): string[] =>
  parseJson<string[]>(raw, []);

export { stringifyList };
