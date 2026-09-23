export const SIMULATED_HOME: { lat: number; lng: number } = { lat: 51.1694, lng: 71.4491 };

function jitter(): number {
  return (Math.random() - 0.5) * 0.0025;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export function nextSimulatedPoint(last: GpsPoint): GpsPoint {
  return {
    lat: last.lat + jitter(),
    lng: last.lng + jitter(),
    timestamp: Date.now(),
  };
}

export function initialSimulatedPoint(): GpsPoint {
  return { ...SIMULATED_HOME, timestamp: Date.now() };
}
