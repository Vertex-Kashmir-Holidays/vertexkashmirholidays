import {
  Award,
  BadgeCheck,
  Ban,
  CableCar,
  Camera,
  Flower2,
  Hotel,
  Lock,
  Mountain,
  Phone,
  Sailboat,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';

// Ticker / marquee strings are authored in the CMS with a leading emoji
// (e.g. "❄️ Gulmarg 18°C Today"). To keep marquees on the lucide icon system
// like the rest of the site, we map that leading emoji to a proper icon and
// render the remaining text as the label. Unknown emoji fall back to plain text.
const MARQUEE_ICONS: Record<string, LucideIcon> = {
  '❄️': Snowflake,
  '❄': Snowflake,
  '🛶': Sailboat,
  '🏔️': Mountain,
  '🏔': Mountain,
  '🌷': Flower2,
  '✅': BadgeCheck,
  '🔒': Lock,
  '📞': Phone,
  '🚫': Ban,
  '⛷️': Award,
  '⛷': Award,
  '🚡': CableCar,
  '🏨': Hotel,
  '📸': Camera,
};

// Matches a single leading emoji (incl. optional variation selector) plus any
// following whitespace, so it can be stripped from the visible label.
const LEADING_EMOJI = /^([⌀-➿⬀-⯿←-⇿\u{1F000}-\u{1FAFF}☀-⛿]️?)\s*/u;

export interface MarqueeItemParts {
  Icon?: LucideIcon;
  label: string;
}

export function parseMarqueeItem(text: string): MarqueeItemParts {
  const match = text.match(LEADING_EMOJI);
  if (!match) return { label: text };
  const emoji = match[1];
  const lookup = (key: string): LucideIcon | undefined => MARQUEE_ICONS[key];
  const Icon = lookup(emoji) ?? lookup(emoji.replace('️', ''));
  // Keep the emoji in the label when we have no icon for it, so nothing is lost.
  return Icon ? { Icon, label: text.slice(match[0].length) } : { label: text };
}
