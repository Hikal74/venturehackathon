import { Info } from "lucide-react";

export function SafetyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-secondary/60 p-3.5">
      <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-foreground">Confidence &amp; limitations</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
