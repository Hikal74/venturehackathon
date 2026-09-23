export function staggerDelay(index: number, stepMs = 60, maxSteps = 8): number {
  return Math.min(index, maxSteps) * stepMs;
}
