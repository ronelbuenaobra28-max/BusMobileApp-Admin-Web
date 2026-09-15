export interface GeocodingResult {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeType: string;
}

const MAPTILER_GEOCODING_BASE = "https://api.maptiler.com/geocoding";

function getApiKey(): string {
  const key = import.meta.env.VITE_MAPTILER_API_KEY;
  if (!key) {
    throw new Error("MapTiler API key is not configured.");
  }
  return key;
}

function buildPlaceName(feature: {
  place_name?: string;
  text?: string;
  context?: Array<{ text?: string }>;
}): string {
  if (feature.place_name) {
    return feature.place_name;
  }
  const parts = [feature.text];
  if (feature.context) {
    for (const item of feature.context) {
      if (item.text) {
        parts.push(item.text);
      }
    }
  }
  return parts.join(", ");
}

export async function searchLocations(
  query: string,
  options?: { limit?: number },
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const apiKey = getApiKey();
  const limit = options?.limit ?? 6;
  const url = new URL(`${MAPTILER_GEOCODING_BASE}/${encodeURIComponent(trimmed)}.json`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("language", "en");
  url.searchParams.set("country", "ph");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Location search authentication failed.");
  }

  if (!response.ok) {
    throw new Error("Location search is temporarily unavailable.");
  }

  const payload = (await response.json()) as {
    features?: Array<{
      id?: string;
      text?: string;
      place_name?: string;
      place_type?: string[];
      relevance?: number;
      geometry?: {
        coordinates?: [number, number];
      };
      context?: Array<{ text?: string }>;
    }>;
  };

  if (!payload.features || !Array.isArray(payload.features)) {
    return [];
  }

  const seen = new Set<string>();
  const results: GeocodingResult[] = [];

  for (const feature of payload.features) {
    if (!Array.isArray(feature.geometry?.coordinates)) {
      continue;
    }

    const [longitude, latitude] = feature.geometry!.coordinates!;
    const dedupKey = feature.id ?? `${latitude}-${longitude}`;
    if (seen.has(dedupKey)) {
      continue;
    }
    seen.add(dedupKey);

    const name = feature.text ?? trimmed;
    const formattedAddress = buildPlaceName(feature);
    const placeType = Array.isArray(feature.place_type)
      ? feature.place_type[0]
      : feature.place_type ?? "place";

    results.push({
      id: feature.id ?? dedupKey,
      name,
      formattedAddress,
      latitude,
      longitude,
      placeType,
    });
  }

  results.sort((a, b) => b.id.localeCompare(a.id));

  return results;
}
