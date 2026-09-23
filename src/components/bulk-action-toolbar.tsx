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
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-slate-600">
        <span className="font-medium text-slate-900">{selectedCount}</span>{" "}
        selected
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBulkDelete}
        disabled={loading}
        className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        {icon}
        {label}
      </Button>
    </div>
  );
}
