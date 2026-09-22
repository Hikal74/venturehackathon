/**
 * Domain-level types and the single source of truth for how a "state"
 * (calm / mild elevation / ... ) is labeled, colored, and described in the
 * UI. Centralizing this means the dashboard, timeline, and pattern views
 * can't drift into inconsistent wording or colors for the same state.
 */

/** States that correspond to an `events` table row (excludes calm/insufficient_data, which never have an open episode). */
export const EVENT_STATES = ["mild_elevation", "elevated", "high_elevation", "recovering"] as const;
export type EventTableState = (typeof EVENT_STATES)[number];

export function isEventState(state: string): state is EventTableState {
  return (EVENT_STATES as readonly string[]).includes(state);
}

export const CARE_PROFILE_STATES = [
  "calm",
  "mild_elevation",
  "elevated",
  "high_elevation",
  "recovering",
  "insufficient_data",
] as const;
export type CareProfileState = (typeof CARE_PROFILE_STATES)[number];

export interface StateMeta {
  label: string;
  /** Plain-language, non-diagnostic description shown under the label. */
  description: string;
  colorVar: string; // CSS var name, e.g. "--status-good"
  colorClass: string; // Tailwind text/bg color utility root, e.g. "status-good"
  /** Border pattern used in claymorphic status cards — carries meaning without relying on color alone. */
  borderStyle: "solid" | "dashed" | "dotted";
}

export const STATE_META: Record<CareProfileState, StateMeta> = {
  calm: {
    label: "Calm",
    description: "Signals are within this person's typical baseline range.",
    colorVar: "--status-good",
    colorClass: "status-good",
    borderStyle: "solid",
  },
  mild_elevation: {
    label: "Mild Elevation",
    description: "Signals are slightly above this person's recent baseline.",
    colorVar: "--status-warning",
    colorClass: "status-warning",
    borderStyle: "solid",
  },
  elevated: {
    label: "Elevated",
    description: "Signals are notably above this person's recent baseline.",
    colorVar: "--status-serious",
    colorClass: "status-serious",
    borderStyle: "dashed",
  },
  high_elevation: {
    label: "High Elevation",
    description: "Signals are substantially above this person's recent baseline.",
    colorVar: "--status-critical",
    colorClass: "status-critical",
    borderStyle: "dashed",
  },
  recovering: {
    label: "Recovering",
    description: "Signals are trending back toward this person's baseline.",
    colorVar: "--status-recovering",
    colorClass: "status-recovering",
    borderStyle: "dotted",
  },
  insufficient_data: {
    label: "Insufficient Data",
    description: "Not enough recent readings to compare against a baseline yet.",
    colorVar: "--status-insufficient",
    colorClass: "status-insufficient",
    borderStyle: "dotted",
  },
};

export const METRICS = ["heart_rate", "hrv", "gsr", "skin_temp", "activity_level"] as const;
export type Metric = (typeof METRICS)[number];

export const METRIC_META: Record<Metric, { label: string; unit: string; colorVar: string }> = {
  heart_rate: { label: "Heart Rate", unit: "BPM", colorVar: "--series-heart-rate" },
  hrv: { label: "HRV", unit: "ms", colorVar: "--series-hrv" },
  gsr: { label: "GSR", unit: "µS", colorVar: "--series-gsr" },
  skin_temp: { label: "Skin Temperature", unit: "°C", colorVar: "--series-skin-temp" },
  activity_level: { label: "Activity", unit: "%", colorVar: "--series-activity" },
};

/** The four evidence categories Aura AI must distinguish in every response (see docs/AI_SYSTEM.md). */
export type EvidenceKind = "measured" | "calculated" | "observed" | "inferred";

export const EVIDENCE_META: Record<EvidenceKind, { label: string; description: string }> = {
  measured: { label: "Measured", description: "A raw sensor reading." },
  calculated: { label: "Calculated", description: "Derived from readings via the baseline/deviation engine." },
  observed: { label: "Observed", description: "Entered by a caregiver." },
  inferred: { label: "Inferred", description: "A pattern or association Aura AI noticed — not a proven cause." },
};
