// Live weather via Open-Meteo (https://open-meteo.com) — free, no API key.
// Used by destination detail pages to show current conditions. Results are
// cached for 30 minutes through the Next fetch cache so we never hammer the API
// (each unique lat/lon URL is cached independently).

export interface LiveWeather {
  temperature: number; // °C, rounded
  condition: string;
  humidity: number; // %
  wind: number; // km/h
  feelsLike: number; // °C
}

// WMO weather interpretation codes → human labels.
// https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Thunderstorm + hail",
};

// Key Kashmir destinations for the homepage weather strip
export const KASHMIR_LOCATIONS = [
  { name: 'Srinagar', latitude: 34.0837, longitude: 74.7973 },
  { name: 'Gulmarg', latitude: 34.0484, longitude: 74.3805 },
  { name: 'Pahalgam', latitude: 34.0161, longitude: 75.3150 },
] as const;

/**
 * Fetch live weather for all three key Kashmir locations in parallel.
 * Returns only the entries where data was successfully retrieved.
 */
export async function getKashmirWeather(): Promise<
  { name: string; temperature: number; condition: string }[]
> {
  const results = await Promise.all(
    KASHMIR_LOCATIONS.map(async (loc) => {
      const w = await getLiveWeather(loc.latitude, loc.longitude);
      return w ? { name: loc.name, temperature: w.temperature, condition: w.condition } : null;
    })
  );
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * Fetch current conditions for a coordinate. Returns null on any failure (bad
 * coords, network error, unexpected payload) so callers can fall back to a
 * sensible default rather than break the page.
 */
export async function getLiveWeather(
  latitude: number,
  longitude: number,
): Promise<LiveWeather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    const c = data.current;
    if (!c || typeof c.temperature_2m !== "number") return null;

    return {
      temperature: Math.round(c.temperature_2m),
      condition: WEATHER_CODES[c.weather_code ?? -1] ?? "—",
      humidity: Math.round(c.relative_humidity_2m ?? 0),
      wind: Math.round(c.wind_speed_10m ?? 0),
      feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m),
    };
  } catch {
    return null;
  }
}
