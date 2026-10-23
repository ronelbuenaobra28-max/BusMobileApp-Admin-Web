import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRESETS, presetRange, type Preset, type useSalesRange } from "./sales-range";
import { cn } from "@/lib/utils";

/** Preset buttons, a custom from/to and the By day / By month toggle. */
export function RangeControls({ state }: { state: ReturnType<typeof useSalesRange> }) {
  const { preset, setPreset, range, setRange, group, setGroup } = state;

  const choosePreset = (p: Exclude<Preset, "custom">) => {
    setPreset(p);
    setRange(presetRange(p));
    if (p === "year") setGroup("month");
  };

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={preset === p.value ? "default" : "outline"}
            className={cn(preset !== p.value && "bg-white")}
            aria-pressed={preset === p.value}
            onClick={() => choosePreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Input
          type="date"
          aria-label="From"
          className="w-[150px] bg-white"
          value={range.from}
          max={range.to}
          onChange={(e) => {
            setPreset("custom");
            setRange((r) => ({ ...r, from: e.target.value }));
          }}
        />
        <span>to</span>
        <Input
          type="date"
          aria-label="To"
          className="w-[150px] bg-white"
          value={range.to}
          min={range.from}
          onChange={(e) => {
            setPreset("custom");
            setRange((r) => ({ ...r, to: e.target.value }));
          }}
        />
        <div className="ml-1 inline-flex rounded-md border border-slate-200 bg-white p-0.5" role="group" aria-label="Group by">
          {(["day", "month"] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium transition-colors",
                group === g ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              By {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
