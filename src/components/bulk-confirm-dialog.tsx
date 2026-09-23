import { ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  selectedNames?: string[];
  children?: ReactNode;
}

export function BulkConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title,
  description,
  confirmLabel = "Delete",
  selectedNames = [],
  children,
}: BulkConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      loading={loading}
    >
      {selectedNames.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          <p className="mb-1 font-medium">Selected items:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {selectedNames.slice(0, 5).map((name) => (
              <li key={name}>{name}</li>
            ))}
            {selectedNames.length > 5 && (
              <li>...and {selectedNames.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
      {children}
    </ConfirmDialog>
  );
}
