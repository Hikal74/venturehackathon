"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Leaflet touches `window`/`document` at import time, which breaks Next's
// server render -- ssr: false is the standard fix, deferring the actual
// map to the client only, same as any other browser-only widget.
const LocationMapInner = dynamic(() => import("./location-map-inner"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>,
});

/**
 * A simulated GPS trail on an OpenStreetMap-based map (Leaflet -- free,
 * no API key, no billing account, unlike Google Maps' JS API). There is
 * no real location data anywhere in this app; see lib/simulated-gps.ts
 * for exactly what's faked and why. Labeled the same way the landing
 * page labels its own illustrative preview, so it's never mistaken for
 * a real tracked location.
 */
export function LocationMap() {
  return (
    <div className="clay flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Device location</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Illustrative simulation
        </span>
      </div>
      <div className="h-72 w-full overflow-hidden rounded-2xl border border-border">
        <LocationMapInner />
      </div>
      <p className="text-xs text-muted-foreground">
        No physical AuraLink wearable sends real location data yet -- this is a simulated GPS trail, generated
        in your browser only, never stored or sent to the server (unlike the sensor readings above, which are
        real HTTP packets hitting the same endpoint a physical device would use).
      </p>
    </div>
  );
}
