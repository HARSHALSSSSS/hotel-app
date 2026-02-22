/**
 * Directions using OSRM (Open Source Routing Machine) - free, no API key required.
 * OSRM uses OpenStreetMap data. Polyline decode supports Google's encoding format
 * (used by OSRM when geometries=polyline) and GeoJSON (when geometries=geojson).
 */
export interface DirectionsResult {
  coordinates: { latitude: number; longitude: number }[];
  distanceMeters?: number;
  durationSeconds?: number;
}

/** Convert GeoJSON [lng, lat] to { latitude, longitude } */
function geojsonToCoords(coords: [number, number][]): { latitude: number; longitude: number }[] {
  return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

const OSRM_BASE = "https://router.project-osrm.org";

export async function fetchDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<DirectionsResult | null> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const geometry = route.geometry;
    if (!geometry?.coordinates?.length) return null;
    const coordinates = geojsonToCoords(geometry.coordinates);
    const leg = route.legs?.[0];
    return {
      coordinates,
      distanceMeters: leg?.distance ?? route.distance,
      durationSeconds: leg?.duration ?? route.duration,
    };
  } catch {
    return null;
  }
}
