/**
 * Preset sensor packets for the Device Simulator (PROJECT spec §17). These
 * are plausible values for a physiological state, not derived from any
 * individual's baseline — they exist to make the simulator quick to drive
 * during a demo. Manual entry (any value in valid range) is also always
 * available for judges who want to try edge cases.
 */
export interface SimulatorPreset {
  id: string;
  label: string;
  description: string;
  values: {
    heartRate: number;
    hrv: number;
    gsr: number;
    skinTemp: number;
    activityLevel: number;
  };
}

export const SIMULATOR_PRESETS: SimulatorPreset[] = [
  {
    id: "calm",
    label: "Calm",
    description: "Typical resting signals.",
    values: { heartRate: 76, hrv: 58, gsr: 2.2, skinTemp: 36.5, activityLevel: 15 },
  },
  {
    id: "mild_elevation",
    label: "Mild Elevation",
    description: "Slightly above typical resting signals.",
    values: { heartRate: 92, hrv: 46, gsr: 3.1, skinTemp: 36.7, activityLevel: 32 },
  },
  {
    id: "high_elevation",
    label: "High Elevation",
    description: "Substantially above typical resting signals.",
    values: { heartRate: 118, hrv: 32, gsr: 4.6, skinTemp: 37.1, activityLevel: 58 },
  },
  {
    id: "recovery",
    label: "Recovery",
    description: "Trending back down after an elevated period.",
    values: { heartRate: 84, hrv: 50, gsr: 2.6, skinTemp: 36.6, activityLevel: 22 },
  },
];
