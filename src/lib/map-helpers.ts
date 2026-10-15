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
