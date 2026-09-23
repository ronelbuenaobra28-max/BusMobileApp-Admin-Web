import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

interface BulkActionToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

export function BulkActionToolbar({
  selectedCount,
  onBulkDelete,
  loading = false,
  icon = <Trash2 className="h-4 w-4" />,
  label = "Delete",
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
      <span className="text-slate-700">
        <span className="font-medium">{selectedCount}</span> selected
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={onBulkDelete}
        disabled={loading}
        className="gap-2"
      >
        {icon}
        {label}
      </Button>
    </div>
  );
}
