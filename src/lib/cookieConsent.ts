// Cookie consent state — localStorage only, never a server-read cookie.
// (public)/layout.tsx deliberately avoids headers()/cookies() to stay
// ISR-cacheable (see the perf audit fix); reading consent server-side here
// would reintroduce that exact regression. Consent is checked client-side by
// GTMScript and AttributionCapture instead, both already client components.

const CONSENT_KEY = "vkh_cookie_consent";
// Bump this if the cookie categories or policy meaningfully change, to force
// every visitor to be re-prompted instead of silently keeping a stale choice.
const CONSENT_VERSION = 1;
const CONSENT_CHANGE_EVENT = "vkh-cookie-consent-change";
const OPEN_PREFERENCES_EVENT = "vkh-open-cookie-preferences";

export interface CookieConsent {
  analytics: boolean;
  version: number;
  timestamp: number;
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // A version mismatch is treated as "not yet decided" so the banner re-prompts.
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(analytics: boolean): void {
  if (typeof window === "undefined") return;
  const consent: CookieConsent = { analytics, version: CONSENT_VERSION, timestamp: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: consent }));
}

/** Fires when consent is saved/changed — GTMScript and AttributionCapture listen so
 *  accepting mid-session takes effect immediately, with no page refresh needed. */
export function onCookieConsentChange(handler: (consent: CookieConsent) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<CookieConsent>).detail);
  window.addEventListener(CONSENT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
}

/** Reopens the preferences Sheet from anywhere (e.g. the Footer's "Cookie
 *  Preferences" link) without needing to lift state through the whole tree. */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}

export function onOpenCookiePreferences(handler: () => void): () => void {
  window.addEventListener(OPEN_PREFERENCES_EVENT, handler);
  return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handler);
}
