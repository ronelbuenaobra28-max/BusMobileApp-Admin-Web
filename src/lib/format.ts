/** Display formatting shared by the Partner Portal pages (Manila time, PHP). */
const TZ = "Asia/Manila";

export const peso = (value: number, fractionDigits = 2) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const count = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const compact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/** "Fri, Oct 24, 8:30 AM" */
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** "8:30 AM" */
export const timeOnly = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

/** A YYYY-MM-DD date (no time) as "Oct 24" or, with the year, "Oct 24, 2026". */
export const dayLabel = (ymd: string, withYear = false) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

/** A YYYY-MM-DD month start as "Oct 2026". */
export const monthLabel = (ymd: string) => {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-PH", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  });
};

/** Today in Manila as YYYY-MM-DD. */
export const manilaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

/** YYYY-MM-DD shifted by whole days. */
export const addDays = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

/** One quoted CSV cell. Text that a spreadsheet would run as a formula
 *  (starting with = + - @, a tab or a carriage return), such as a company
 *  name, gets a leading apostrophe so Excel and Sheets show it as text.
 *  Numbers, including negative amounts like "-5.00", are left alone. */
export function csvCell(v: string | number): string {
  let text = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

/** Download rows as a CSV file (quotes every cell; Excel-friendly BOM). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
