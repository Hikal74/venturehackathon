import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getDailySummary, getWeeklyReport } from "@/services/reports";
import { ReportView } from "@/components/reports/report-view";
import { PrintButton } from "@/components/reports/print-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ReportsPage() {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const now = new Date();
  const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [daily, weekly] = await Promise.all([
    getDailySummary(supabase, active.id, now),
    getWeeklyReport(supabase, active.id, weekStart),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Computed from stored data — no AI call required to view.</p>
        </div>
        <PrintButton />
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="print:hidden">
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Aura Report</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="clay mt-4 p-6">
          <ReportView report={daily} careProfileName={active.display_name} />
        </TabsContent>
        <TabsContent value="weekly" className="clay mt-4 p-6">
          <ReportView report={weekly} careProfileName={active.display_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
