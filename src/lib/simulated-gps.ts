/**
 * Simulated GPS for the Devices page — same honesty convention as the rest
 * of the simulator (see docs/ARCHITECTURE.md "What's simulated vs. real"):
 * there is no physical AuraLink wearable and no real location data. This
 * generates a plausible-looking breadcrumb trail client-side only; it is
 * never sent to the server or stored, unlike the physiological readings
 * the Device Simulator actually POSTs to /api/device/readings. Labeled
 * "Illustrative simulation" wherever it's shown, matching the landing
 * page's "Illustrative preview" convention.
 *
 * Centered on Astana, Kazakhstan — consistent with the app's own
 * lib/timezone.ts APP_TIMEZONE, rather than an arbitrary coordinate.
 */
export const SIMULATED_HOME: { lat: number; lng: number } = { lat: 51.1694, lng: 71.4491 };

/** Small pseudo-random step so the walk looks organic but stays near home (a few hundred meters at most). */
function jitter(): number {
  return (Math.random() - 0.5) * 0.0025;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

/** The next simulated point, one short random-walk step from the last. */
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
