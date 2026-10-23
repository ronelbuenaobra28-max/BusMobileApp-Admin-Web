import { useState } from "react";
import { addDays, manilaToday } from "@/lib/format";

export type Preset = "7d" | "30d" | "month" | "lastMonth" | "year" | "custom";
export type Group = "day" | "month";

export function presetRange(preset: Exclude<Preset, "custom">): { from: string; to: string } {
  const today = manilaToday();
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (preset) {
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${y}-${pad(m)}-01`, to: today };
    case "lastMonth": {
      const firstThis = `${y}-${pad(m)}-01`;
      const lastPrev = addDays(firstThis, -1);
      return { from: `${lastPrev.slice(0, 7)}-01`, to: lastPrev };
    }
    case "year":
      return { from: `${y}-01-01`, to: today };
  }
}

export const PRESETS: { value: Exclude<Preset, "custom">; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "year", label: "This year" },
];

/** Date range (Manila days) and day/month grouping for a sales report. */
export function useSalesRange() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [range, setRange] = useState(() => presetRange("30d"));
  const [group, setGroup] = useState<Group>("day");
  return { preset, setPreset, range, setRange, group, setGroup };
}
