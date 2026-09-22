"use client";

import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteMyDataAction } from "@/app/care-profile/actions";

export function DeleteDataDialog({ careProfileId, careProfileName }: { careProfileId: string; careProfileName: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-status-critical/30 text-status-critical hover:bg-status-critical/10">
          <Trash2 className="h-4 w-4" /> Delete My Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permanently delete {careProfileName}&apos;s data?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the care profile and every reading, event, observation, AI conversation, and report tied
            to it. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteMyDataAction}>
            <input type="hidden" name="careProfileId" value={careProfileId} />
            <AlertDialogAction asChild>
              <button type="submit" className="bg-status-critical text-white hover:bg-status-critical/90">
                Delete permanently
              </button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
