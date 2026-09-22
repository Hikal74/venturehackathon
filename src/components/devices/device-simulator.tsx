"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SIMULATOR_PRESETS } from "@/lib/demo/simulator-presets";
import { STATE_META, type CareProfileState } from "@/types/domain";

interface SensorValues {
  heartRate: number;
  hrv: number;
  gsr: number;
  skinTemp: number;
  activityLevel: number;
}

const FIELDS: { key: keyof SensorValues; label: string; unit: string; min: number; max: number; step: number }[] = [
  { key: "heartRate", label: "Heart Rate", unit: "BPM", min: 40, max: 180, step: 1 },
  { key: "hrv", label: "HRV", unit: "ms", min: 5, max: 100, step: 1 },
  { key: "gsr", label: "GSR", unit: "µS", min: 0.2, max: 8, step: 0.1 },
  { key: "skinTemp", label: "Skin Temperature", unit: "°C", min: 34, max: 39, step: 0.1 },
  { key: "activityLevel", label: "Activity", unit: "%", min: 0, max: 100, step: 1 },
];

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "error"; message: string }
  | { status: "sent"; state: CareProfileState };

export function DeviceSimulator({ careProfileId }: { careProfileId: string }) {
  const [values, setValues] = useState<SensorValues>(SIMULATOR_PRESETS[0].values);
  const [activePreset, setActivePreset] = useState<string | null>(SIMULATOR_PRESETS[0].id);
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function applyPreset(presetId: string) {
    const preset = SIMULATOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setValues(preset.values);
    setActivePreset(presetId);
  }

  function updateField(key: keyof SensorValues, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }

  async function sendPacket() {
    setSendState({ status: "sending" });
    try {
      const res = await fetch("/api/device/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careProfileId,
          heartRate: values.heartRate,
          hrv: values.hrv,
          gsr: values.gsr,
          skinTemp: values.skinTemp,
          activityLevel: values.activityLevel,
          source: "simulator",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSendState({ status: "error", message: json.error ?? "Failed to send packet." });
        return;
      }
      setSendState({ status: "sent", state: json.state });
      startTransition(() => router.refresh());
    } catch {
      setSendState({ status: "error", message: "Network error — could not reach the ingestion endpoint." });
    }
  }

  return (
    <div className="clay flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-status-recovering" />
        <div>
          <h2 className="text-lg font-semibold">Device Simulator</h2>
          <p className="text-sm text-muted-foreground">
            Sends a real sensor packet to <code className="rounded bg-secondary px-1 py-0.5 text-xs">POST /api/device/readings</code> —
            the same endpoint a physical AuraLink wearable would call.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SIMULATOR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            title={preset.description}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activePreset === preset.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-accent"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>{field.label}</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {values[field.key]} {field.unit}
              </span>
            </div>
            <Slider
              min={field.min}
              max={field.max}
              step={field.step}
              value={[values[field.key]]}
              onValueChange={([v]) => updateField(field.key, v)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button size="lg" onClick={sendPacket} disabled={sendState.status === "sending" || isPending} className="gap-2">
          {sendState.status === "sending" || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          Send Sensor Packet
        </Button>

        {sendState.status === "sent" && (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: `var(${STATE_META[sendState.state].colorVar})` }}>
            <CheckCircle2 className="h-4 w-4" />
            Stored — classified as {STATE_META[sendState.state].label}
          </span>
        )}
        {sendState.status === "error" && <span className="text-sm text-status-critical">{sendState.message}</span>}
      </div>
    </div>
  );
}
