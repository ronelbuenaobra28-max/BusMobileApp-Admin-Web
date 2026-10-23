import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TONES = {
  teal: "bg-primary-50 text-primary-700",
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
} as const;

/** One KPI tile: label, big value, note and a tinted icon. */
export function StatTile({
  label,
  value,
  note,
  icon: Icon,
  tone = "teal",
  loading,
  index = 0,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  loading?: boolean;
  index?: number;
}) {
  return (
    <Card
      className="group animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:animate-none motion-reduce:hover:translate-y-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="truncate text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          )}
          {note && <p className="text-xs text-slate-500">{note}</p>}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

/** "18 / 45" with a thin bar; amber from 85% full so near-full trips stand out. */
export function LoadBar({ sold, capacity }: { sold: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, (sold / capacity) * 100) : 0;
  return (
    <div className="min-w-[96px] space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-slate-900">
          {sold} / {capacity || "?"}
        </span>
        <span className="text-slate-500">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            pct >= 85 ? "bg-amber-500" : "bg-primary-600",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
