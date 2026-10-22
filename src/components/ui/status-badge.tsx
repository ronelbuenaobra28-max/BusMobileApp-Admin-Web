import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "info" | "danger" | "neutral" | "brand";

// Every status value the API sends, mapped to a tone. Unknown values fall
// back to neutral, so a new status still renders, just without colour.
const TONES: Record<string, Tone> = {
  active: "success",
  available: "success",
  paid: "success",
  verified: "success",
  approved: "success",
  completed: "success",
  boarded: "info",
  scheduled: "info",
  onboarding: "warning",
  on_trip: "info",
  pending: "warning",
  maintenance: "warning",
  inactive: "neutral",
  retired: "neutral",
  off_duty: "neutral",
  refunded: "neutral",
  cancelled: "danger",
  rejected: "danger",
  failed: "danger",
};

// Container + dark text pairs; all pass WCAG AA (> 4.5:1).
const TONE_CLASSES: Record<Tone, { pill: string; dot: string }> = {
  success: { pill: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", dot: "bg-emerald-500" },
  warning: { pill: "bg-amber-50 text-amber-800 ring-amber-600/25", dot: "bg-amber-500" },
  info: { pill: "bg-sky-50 text-sky-800 ring-sky-600/20", dot: "bg-sky-500" },
  danger: { pill: "bg-red-50 text-red-800 ring-red-600/20", dot: "bg-red-500" },
  neutral: { pill: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-400" },
  brand: { pill: "bg-primary-50 text-primary-800 ring-primary-600/20", dot: "bg-primary-500" },
};

function humanize(status: string) {
  const words = status.replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "Unknown";
}

/**
 * Pill for a status value ("active", "on_trip", "cancelled", ...): a coloured
 * dot plus the readable label, so the state is not told by colour alone.
 */
function StatusBadge({
  status,
  label,
  className,
}: {
  status: string | null | undefined;
  /** Overrides the humanized status text. */
  label?: string;
  className?: string;
}) {
  const key = (status ?? "").toLowerCase();
  const tone = TONES[key] ?? "neutral";
  const { pill, dot } = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        pill,
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label ?? humanize(key)}
    </span>
  );
}

export { StatusBadge };
