"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

/**
 * A compact per-metric trend line. Each metric gets its OWN chart with its
 * own y-scale (small multiples) rather than one shared-axis chart across
 * all five metrics — heart rate (~70-100) and skin temperature (~36-38) on
 * one linear axis would make the smaller-range series unreadable. One axis
 * per chart, one hue per chart; see the dataviz skill's anti-patterns on
 * dual/mismatched axes.
 */
export function Sparkline({ data, color }: { data: { value: number; label: string }[]; color: string }) {
  if (data.length < 2) {
    return <div className="h-10 w-full" />;
  }

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--chart-surface)",
            }}
            formatter={(value) => {
              const num = Array.isArray(value) ? Number(value[0]) : Number(value);
              return [Number.isFinite(num) ? Math.round(num * 100) / 100 : "—", ""];
            }}
            labelFormatter={(label) => label}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
