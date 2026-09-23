import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSessionContext } from "@/lib/session";
import { getTimelineForDay } from "@/services/timeline";
import { TimelineList } from "@/components/timeline/timeline-list";
import { AddObservationDialog } from "@/components/timeline/add-observation-dialog";
import { Button } from "@/components/ui/button";
import { astanaDateParam, astanaMidnightFor, formatDate, startOfDayInAstana } from "@/lib/timezone";

function parseDate(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const d = astanaMidnightFor(year, month, day);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return startOfDayInAstana();
}

function toDateParam(date: Date): string {
  return astanaDateParam(date);
}

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const params = await searchParams;
  const day = parseDate(params.date);
  const prevDay = new Date(day.getTime() - 24 * 60 * 60 * 1000);
  const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  const isToday = toDateParam(day) === toDateParam(new Date());

  const entries = await getTimelineForDay(supabase, active.id, day);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(day, { weekday: "long", month: "long", day: "numeric" })}
            {isToday && " · Today"}
          </p>
        </div>
        <AddObservationDialog careProfileId={active.id} />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/timeline?date=${toDateParam(prevDay)}`} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Previous day
          </Link>
        </Button>
        {!isToday && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/timeline?date=${toDateParam(nextDay)}`} className="gap-1">
              Next day <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div className="clay p-6">
        <TimelineList entries={entries} />
      </div>
    </div>
  );
}
