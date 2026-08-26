export function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function resolveMapsUrl(item: {
  mapsUrl?: string | null;
  locationName?: string | null;
  address?: string | null;
}): string | null {
  if (item.mapsUrl) return item.mapsUrl;
  const query = item.address || item.locationName;
  if (!query) return null;
  return buildMapsSearchUrl(query);
}
