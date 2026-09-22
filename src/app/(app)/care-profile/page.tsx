import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getSessionContext } from "@/lib/session";
import { EditProfileForm } from "@/components/care-profile/edit-profile-form";
import { TagManager } from "@/components/care-profile/tag-manager";
import { DeleteDataDialog } from "@/components/care-profile/delete-data-dialog";
import { Button } from "@/components/ui/button";
import {
  addTriggerAction,
  removeTriggerAction,
  addSupportStrategyAction,
  removeSupportStrategyAction,
} from "@/app/care-profile/tag-actions";

export default async function CareProfilePage() {
  const { supabase, active } = await getSessionContext();
  if (!active) redirect("/onboarding");

  const [{ data: triggers }, { data: strategies }] = await Promise.all([
    supabase.from("triggers").select("id, label").eq("care_profile_id", active.id).order("created_at"),
    supabase.from("support_strategies").select("id, label").eq("care_profile_id", active.id).order("created_at"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Care Profile</h1>
        <p className="text-sm text-muted-foreground">Preferences and profile-specific information for {active.display_name}.</p>
      </div>

      <div className="clay p-6">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Basic information</h2>
        <EditProfileForm
          careProfileId={active.id}
          displayName={active.display_name}
          ageRange={active.age_range}
          preferredLanguage={active.preferred_language}
        />
      </div>

      <div className="clay p-6">
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Known sensitivities</h2>
        <p className="mb-4 text-xs text-muted-foreground">Profile-specific preferences — not a universal or medical list.</p>
        <TagManager
          items={(triggers ?? []).map((t) => ({ id: t.id, label: t.label }))}
          careProfileId={active.id}
          addAction={addTriggerAction}
          removeAction={removeTriggerAction}
          placeholder="Add a sensitivity…"
        />
      </div>

      <div className="clay p-6">
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">Known support strategies</h2>
        <p className="mb-4 text-xs text-muted-foreground">Aura AI prioritizes these when suggesting a response.</p>
        <TagManager
          items={(strategies ?? []).map((s) => ({ id: s.id, label: s.label }))}
          careProfileId={active.id}
          addAction={addSupportStrategyAction}
          removeAction={removeSupportStrategyAction}
          placeholder="Add a support strategy…"
        />
      </div>

      <div className="clay flex flex-col gap-4 border border-dashed border-status-critical/30 p-6">
        <div>
          <h2 className="text-sm font-semibold">Privacy & data</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Export everything stored for {active.display_name}, or permanently delete it.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="gap-2">
            <a href={`/api/export?careProfileId=${active.id}`} download>
              <Download className="h-4 w-4" /> Export My Data
            </a>
          </Button>
          <DeleteDataDialog careProfileId={active.id} careProfileName={active.display_name} />
        </div>
      </div>
    </div>
  );
}
