import { useMemo, useState } from "react";
import { BarChart3, Download, Info, ReceiptText, Undo2, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatTile } from "@/components/partner/widgets";
import { usePartnerMe, usePartnerSales } from "@/lib/partner-hooks";
import { addDays, compact, count, dayLabel, downloadCsv, manilaToday, monthLabel, peso } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Preset = "7d" | "30d" | "month" | "lastMonth" | "year" | "custom";

function presetRange(preset: Exclude<Preset, "custom">): { from: string; to: string } {
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

const PRESETS: { value: Exclude<Preset, "custom">; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "year", label: "This year" },
];

export default function PartnerSalesPage() {
  const { data: me } = usePartnerMe();
  const [preset, setPreset] = useState<Preset>("30d");
  const [range, setRange] = useState(() => presetRange("30d"));
  const [group, setGroup] = useState<"day" | "month">("day");
  const { data, isLoading, isFetching, error, refetch } = usePartnerSales({
    date_from: range.from,
    date_to: range.to,
    group,
  });
  const periodLabel = (p: string) => (group === "month" ? monthLabel(p) : dayLabel(p, true));
  const totals = data?.totals;

  const choosePreset = (p: Exclude<Preset, "custom">) => {
    setPreset(p);
    setRange(presetRange(p));
    if (p === "year") setGroup("month");
  };

  const chartData = useMemo(() => data?.rows ?? [], [data]);

  const exportCsv = () => {
    if (!data) return;
    const company = (me?.operator_name ?? "seatpass").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(
      `${company}-sales-${data.date_from}-to-${data.date_to}.csv`,
      [
        group === "month" ? "Month" : "Date",
        "Paid transactions",
        "Seats",
        "Collected from passengers (PHP)",
        "SeatPass booking fees (PHP)",
        "Ticket sales (PHP)",
        "Refunded payments",
        "Refunded amount (PHP)",
      ],
      [
        ...data.rows.map((r) => [
          r.period,
          r.transactions,
          r.seats,
          r.collected.toFixed(2),
          r.seatpass_fees.toFixed(2),
          r.ticket_sales.toFixed(2),
          r.refunded_count,
          r.refunded_amount.toFixed(2),
        ]),
        [
          "Total",
          data.totals.transactions,
          data.totals.seats,
          data.totals.collected.toFixed(2),
          data.totals.seatpass_fees.toFixed(2),
          data.totals.ticket_sales.toFixed(2),
          data.totals.refunded_count,
          data.totals.refunded_amount.toFixed(2),
        ],
      ],
    );
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-2">
      <PageHeader
        title="Sales"
        description="Your ticket sales (kita) from SeatPass online bookings"
        action={
          <Button variant="outline" className="bg-white" onClick={exportCsv} disabled={!data || data.rows.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

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

      {error && <ErrorState title="Couldn't load sales" message={error.message} onRetry={() => void refetch()} />}

      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", isFetching && !isLoading && "opacity-70")}>
        <StatTile
          index={0}
          label="Ticket sales (your kita)"
          value={peso(totals?.ticket_sales ?? 0)}
          note={`${count(totals?.seats ?? 0)} seats sold`}
          icon={Wallet}
          tone="emerald"
          loading={isLoading}
        />
        <StatTile
          index={1}
          label="Collected from passengers"
          value={peso(totals?.collected ?? 0)}
          note={`${count(totals?.transactions ?? 0)} paid transactions`}
          icon={ReceiptText}
          tone="teal"
          loading={isLoading}
        />
        <StatTile
          index={2}
          label="SeatPass booking fees"
          value={peso(totals?.seatpass_fees ?? 0)}
          note="Paid by passengers on top of your fares"
          icon={BarChart3}
          tone="sky"
          loading={isLoading}
        />
        <StatTile
          index={3}
          label="Refunded"
          value={peso(totals?.refunded_amount ?? 0)}
          note={`${count(totals?.refunded_count ?? 0)} payments returned`}
          icon={Undo2}
          tone="amber"
          loading={isLoading}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-slate-700">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
        <p>
          Passengers pay your fare plus a {peso(5)} SeatPass booking fee per transaction. Your ticket sales are the
          fares only. Refunds are payments returned because no ticket was issued, so they were never part of your
          ticket sales. Dates follow Philippine time.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Ticket sales by {group}
          </CardTitle>
          <p className="text-xs text-slate-500">
            {dayLabel(range.from, true)} – {dayLabel(range.to, true)}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState title="No sales in this period" description="Try a longer date range." icon={<Wallet />} />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(p: string) => (group === "month" ? monthLabel(p) : dayLabel(p))}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={16}
                    tick={{ fontSize: 12, fill: "#475569" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(v: number) => `₱${compact(v)}`}
                    tick={{ fontSize: 12, fill: "#475569" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(13, 148, 136, 0.06)" }}
                    labelFormatter={(p: string) => periodLabel(p)}
                    formatter={(v: number) => [peso(v), "Ticket sales"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Bar
                    dataKey="ticket_sales"
                    fill="#0f766e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    isAnimationActive={!PREFERS_REDUCED_MOTION}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.rows.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto p-4">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">{group === "month" ? "Month" : "Date"}</th>
                  <th className="px-4 py-3 text-right">Transactions</th>
                  <th className="px-4 py-3 text-right">Seats</th>
                  <th className="px-4 py-3 text-right">Collected</th>
                  <th className="px-4 py-3 text-right">SeatPass fees</th>
                  <th className="px-4 py-3 text-right">Ticket sales</th>
                  <th className="px-4 py-3 text-right">Refunded</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.period} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{periodLabel(r.period)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{count(r.transactions)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{count(r.seats)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{peso(r.collected)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{peso(r.seatpass_fees)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{peso(r.ticket_sales)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {r.refunded_count ? `${peso(r.refunded_amount)} (${r.refunded_count})` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{count(data.totals.transactions)}</td>
                  <td className="px-4 py-3 text-right">{count(data.totals.seats)}</td>
                  <td className="px-4 py-3 text-right">{peso(data.totals.collected)}</td>
                  <td className="px-4 py-3 text-right">{peso(data.totals.seatpass_fees)}</td>
                  <td className="px-4 py-3 text-right text-primary-800">{peso(data.totals.ticket_sales)}</td>
                  <td className="px-4 py-3 text-right">
                    {data.totals.refunded_count ? peso(data.totals.refunded_amount) : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
