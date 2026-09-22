/**
 * Pure helper functions used by pattern-engine.ts, split into their own
 * module with no `server-only` guard (unlike pattern-engine.ts itself) so
 * they can be unit-tested directly with Vitest, which runs in a plain Node
 * environment rather than Next.js's server-component bundling context that
 * `server-only` relies on to distinguish "server" from "client".
 */

export function mostCommon(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [v, count] of counts) {
    if (count > bestCount) {
      best = v;
      bestCount = count;
    }
  }
  return bestCount >= 2 ? best : null;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
