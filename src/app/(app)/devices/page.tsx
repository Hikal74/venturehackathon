import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getRecentReadings } from "@/services/readings-history";
import { DeviceSimulator } from "@/components/devices/device-simulator";
import { formatDateTime } from "@/lib/timezone";
import { METRICS, METRIC_META } from "@/types/domain";

export default async function DevicesPage() {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const recent = await getRecentReadings(supabase, active.id, 6, 10);
  const latestFirst = [...recent].reverse();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <p className="text-sm text-muted-foreground">
          No physical AuraLink wearable connected yet — use the simulator below to send sensor packets for{" "}
          {active.display_name}.
        </p>
      </div>

      <DeviceSimulator careProfileId={active.id} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Recently ingested packets</h2>
        {latestFirst.length === 0 ? (
          <p className="text-sm text-muted-foreground">No packets sent yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  {METRICS.map((m) => (
                    <th key={m} className="px-3 py-2 font-medium">
                      {METRIC_META[m].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {latestFirst.map((reading) => (
                  <tr key={reading.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {formatDateTime(reading.recorded_at, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{reading.source}</td>
                    <td className="px-3 py-2 tabular-nums">{reading.heart_rate}</td>
                    <td className="px-3 py-2 tabular-nums">{reading.hrv ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{reading.gsr ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{reading.skin_temp ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{reading.activity_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
