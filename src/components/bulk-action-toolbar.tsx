import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

interface BulkAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface BulkActionToolbarProps {
  selectedCount: number;
  onBulkDelete?: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  label?: string;
  actions?: BulkAction[];
}

export function BulkActionToolbar({
  selectedCount,
  onBulkDelete,
  loading = false,
  icon = <Trash2 className="h-4 w-4" />,
  label = "Delete",
  actions,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  const renderButton = (action: BulkAction, index: number) => (
    <Button
      key={index}
      variant={action.variant === "destructive" ? "ghost" : "ghost"}
      size="sm"
      onClick={action.onClick}
      disabled={loading}
      className={`gap-1.5 ${
        action.variant === "destructive"
          ? "text-red-600 hover:text-red-700 hover:bg-red-50"
          : "text-slate-600 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      {action.icon}
      {action.label}
    </Button>
  );

  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-slate-600">
        <span className="font-medium text-slate-900">{selectedCount}</span>{" "}
        selected
      </span>
      <div className="flex items-center gap-2">
        {actions ? (
          actions.map(renderButton)
        ) : (
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
        )}
      </div>
    </div>
  );
}
