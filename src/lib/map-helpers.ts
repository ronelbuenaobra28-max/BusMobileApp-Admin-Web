export function isPointInBoundingBox(
  point: [number, number],
  bounds: [[number, number], [number, number]],
): boolean {
  const [lng, lat] = point;
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

export function buildBoundingBox(
  coordinates: [number, number][],
  padding = 0.01,
): [[number, number], [number, number]] {
  if (coordinates.length === 0) {
    return [
      [0, 0],
      [1, 1],
    ];
  }
  const lngs = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  const minLng = Math.min(...lngs) - padding;
  const maxLng = Math.max(...lngs) + padding;
  const minLat = Math.min(...lats) - padding;
  const maxLat = Math.max(...lats) + padding;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function stopsToGeoJSON(stops: { latitude: number; longitude: number }[]) {
  return {
    type: "FeatureCollection",
    features: stops.map((stop) => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [stop.longitude, stop.latitude],
      },
    })),
  };
}

export function routeLineGeoJSON(coords: [number, number][]) {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  };
}

export const MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";
