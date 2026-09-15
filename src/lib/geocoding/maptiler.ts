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
      properties?: {
        name?: string;
        formatted_address?: string;
        place_type?: string[];
        mapbox_id?: string;
      };
      geometry?: {
        coordinates?: [number, number];
      };
    }>;
  };

  if (!payload.features || !Array.isArray(payload.features)) {
    return [];
  }

  return payload.features
    .filter((feature) => Array.isArray(feature.geometry?.coordinates))
    .map((feature) => {
      const [longitude, latitude] = feature.geometry!.coordinates!;
      return {
        id: feature.properties?.mapbox_id ?? `${latitude}-${longitude}`,
        name: feature.properties?.name ?? trimmed,
        formattedAddress: feature.properties?.formatted_address ?? trimmed,
        latitude,
        longitude,
        placeType: Array.isArray(feature.properties?.place_type)
          ? feature.properties.place_type[0]
          : feature.properties?.place_type ?? "place",
      };
    });
}
