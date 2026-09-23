import { AlertTriangle, CheckCircle2, TrendingDown, HelpCircle, ArrowUpCircle, ArrowUpRight } from "lucide-react";
import { STATE_META, type CareProfileState } from "@/types/domain";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/timezone";

const ICONS: Record<CareProfileState, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  calm: CheckCircle2,
  mild_elevation: ArrowUpRight,
  elevated: ArrowUpCircle,
  high_elevation: AlertTriangle,
  recovering: TrendingDown,
  insufficient_data: HelpCircle,
};

const BORDER_STYLE_CLASS: Record<string, string> = {
  solid: "border-2",
  dashed: "border-2 border-dashed",
  dotted: "border-2 border-dotted",
};

export function StatusCard({
  state,
  lastUpdated,
  careProfileName,
}: {
  state: CareProfileState;
  lastUpdated: string | null;
  careProfileName: string;
}) {
  const meta = STATE_META[state];
  const Icon = ICONS[state];

  return (
    <div
      className={cn("clay flex flex-col gap-4 p-6 md:p-8", BORDER_STYLE_CLASS[meta.borderStyle])}
      style={{ borderColor: `var(${meta.colorVar})` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">How is {careProfileName} doing right now?</span>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated {formatTime(lastUpdated, { hour: "numeric", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `color-mix(in oklab, var(${meta.colorVar}) 16%, transparent)` }}
        >
          <Icon className="h-7 w-7" style={{ color: `var(${meta.colorVar})` }} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{meta.label}</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This reflects a comparison against {careProfileName}&apos;s own recent signal history — not a medical
        diagnosis, and not a claim about what they&apos;re feeling.
      </p>
    </div>
  );
}
