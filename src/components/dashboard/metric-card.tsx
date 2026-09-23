import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { METRIC_META, type Metric } from "@/types/domain";
import type { MetricDeviation } from "@/lib/analytics/baseline-engine";
import { EvidenceTag } from "@/components/shared/evidence-tag";
import { Sparkline } from "./sparkline";

export function MetricCard({
  metric,
  deviation,
  history,
}: {
  metric: Metric;
  deviation: MetricDeviation | undefined;
  history: { value: number; label: string }[];
}) {
  const meta = METRIC_META[metric];

  if (!deviation) {
    return (
      <div className="card-hover flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
        <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
        <span className="text-sm text-muted-foreground">Not enough baseline history yet</span>
      </div>
    );
  }

  const pct = Math.round(deviation.percentDeviation);
  const Arrow = pct > 2 ? ArrowUp : pct < -2 ? ArrowDown : Minus;

  return (
    <div className="card-hover flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
        <EvidenceTag kind="measured" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums" style={{ color: `var(${meta.colorVar})` }}>
          {formatValue(metric, deviation.value)}
        </span>
        <span className="text-sm text-muted-foreground">{meta.unit}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Arrow className="h-3 w-3" />
        <span>
          {pct >= 0 ? "+" : ""}
          {pct}% relative to recent baseline ({formatValue(metric, deviation.baselineMean)} {meta.unit})
        </span>
      </div>
      <Sparkline data={history} color={`var(${meta.colorVar})`} />
    </div>
  );
}

function formatValue(metric: Metric, value: number): string {
  if (metric === "skin_temp") return value.toFixed(1);
  if (metric === "gsr") return value.toFixed(2);
  return Math.round(value).toString();
}
