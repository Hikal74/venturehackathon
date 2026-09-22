"use client";

import { useRef } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagItem {
  id: string;
  label: string;
}

export function TagManager({
  items,
  careProfileId,
  addAction,
  removeAction,
  placeholder,
}: {
  items: TagItem[];
  careProfileId: string;
  addAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
  placeholder: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <form key={item.id} action={removeAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-status-critical/40 hover:text-status-critical"
              >
                {item.label}
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ))}
        </div>
      )}
      <form
        ref={formRef}
        action={async (formData) => {
          await addAction(formData);
          formRef.current?.reset();
        }}
        className="flex gap-2"
      >
        <input type="hidden" name="careProfileId" value={careProfileId} />
        <Input name="label" placeholder={placeholder} className="max-w-xs" required maxLength={120} />
        <Button type="submit" variant="outline" size="icon" aria-label="Add">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
