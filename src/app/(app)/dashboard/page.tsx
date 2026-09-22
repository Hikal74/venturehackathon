import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getSessionContext } from "@/lib/session";
import { computeCurrentStatus } from "@/lib/analytics/analysis-engine";
import { getRecentReadings } from "@/services/readings-history";
import { StatusCard } from "@/components/dashboard/status-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WhatChangedButton } from "@/components/dashboard/what-changed-button";
import { Button } from "@/components/ui/button";
import { METRICS, STATE_META, type Metric } from "@/types/domain";

export default async function DashboardPage() {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const [status, recentReadings] = await Promise.all([
    computeCurrentStatus(supabase, active.id),
    getRecentReadings(supabase, active.id, 24),
  ]);

  const historyByMetric: Record<Metric, { value: number; label: string }[]> = {
    heart_rate: [],
    hrv: [],
    gsr: [],
    skin_temp: [],
    activity_level: [],
  };
  for (const reading of recentReadings) {
    const label = new Date(reading.recorded_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    for (const metric of METRICS) {
      const value = reading[metric];
      if (value != null) historyByMetric[metric].push({ value, label });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{active.display_name}&apos;s current status</p>
        </div>
        <WhatChangedButton careProfileId={active.id} />
      </div>

      {status.openEvent && (
        <div className="clay-inset flex items-center gap-3 border border-dashed border-status-serious/40 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-status-serious" />
          <div className="flex-1 text-sm">
            <span className="font-medium">
              {STATE_META[status.openEvent.state as keyof typeof STATE_META]?.label ?? status.openEvent.state}
            </span>{" "}
            since {new Date(status.openEvent.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.
            {" "}
            <Link href="/timeline" className="underline underline-offset-2">
              View on timeline
            </Link>
          </div>
        </div>
      )}

      <StatusCard state={status.state} lastUpdated={status.latestReading?.recorded_at ?? null} careProfileName={active.display_name} />

      {!status.latestReading ? (
        <div className="clay flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-muted-foreground">
            No sensor readings yet for {active.display_name}. Send a reading from the Device Simulator to see the
            dashboard come alive.
          </p>
          <Button asChild>
            <Link href="/devices">Open Device Simulator</Link>
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Current signals</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {METRICS.map((metric) => (
              <MetricCard
                key={metric}
                metric={metric}
                deviation={status.deviation.perMetric[metric]}
                history={historyByMetric[metric]}
              />
            ))}
          </div>
          {status.deviation.metricsUsed === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Not enough history yet to compare against a personal baseline (need at least a handful of readings
              spread over time). Values above are shown without a baseline comparison.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/timeline" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
          View full timeline →
        </Link>
        <Link href="/patterns" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
          View detected patterns →
        </Link>
      </div>
    </div>
  );
}
