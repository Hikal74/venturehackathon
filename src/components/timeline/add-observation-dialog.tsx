"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createObservationAction, type ObservationActionState } from "@/app/observations/actions";

const initialState: ObservationActionState = {};

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AddObservationDialog({ careProfileId }: { careProfileId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: ObservationActionState, formData: FormData) => {
    const result = await createObservationAction(prev, formData);
    if (result.success) setOpen(false);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> Add Observation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Observation</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="careProfileId" value={careProfileId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="occurredAt">When</Label>
            <Input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={toDatetimeLocalValue(new Date())} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="environment">Environment</Label>
              <Input id="environment" name="environment" placeholder="e.g. School cafeteria" maxLength={200} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activity">Activity</Label>
              <Input id="activity" name="activity" placeholder="e.g. Lunch" maxLength={200} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="possibleTrigger">Possible trigger</Label>
            <Input id="possibleTrigger" name="possibleTrigger" placeholder="e.g. Crowded cafeteria" maxLength={200} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supportAction">Support action</Label>
            <Input id="supportAction" name="supportAction" placeholder="e.g. Moved to quiet hallway" maxLength={200} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} maxLength={2000} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outcome">Outcome (optional)</Label>
            <Input id="outcome" name="outcome" placeholder="e.g. Settled after several minutes" maxLength={500} />
          </div>

          {state.error && <p className="text-sm text-status-critical">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Saving…" : "Save observation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
