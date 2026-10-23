import { useMemo } from "react";
import { Building2, Download, Info, PiggyBank, ReceiptText, Undo2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatTile } from "@/components/partner/widgets";
import { RangeControls } from "@/components/partner/RangeControls";
import { useSalesRange } from "@/components/partner/sales-range";
import { useAdminEarnings } from "@/lib/partner-hooks";
import { compact, count, dayLabel, downloadCsv, monthLabel, peso } from "@/lib/format";
import { cn } from "@/lib/utils";

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** SeatPass's own money: the booking fee on each paid reservation, kept apart
 *  from the fares that belong to the bus companies. */
export default function EarningsPage() {
  const rangeState = useSalesRange();
  const { range, group } = rangeState;
  const { data, isLoading, isFetching, error, refetch } = useAdminEarnings({
    date_from: range.from,
    date_to: range.to,
    group,
  });
  const periodLabel = (p: string) => (group === "month" ? monthLabel(p) : dayLabel(p, true));
  const totals = data?.totals;
  const fee = data?.platform_fee ?? 5;
  const chartData = useMemo(() => data?.rows ?? [], [data]);

  const exportCsv = () => {
    if (!data) return;
    const money = (n: number) => n.toFixed(2);
    downloadCsv(
      `seatpass-earnings-${data.date_from}-to-${data.date_to}.csv`,
      [
        "Company",
        "Paid transactions",
        "Seats",
        "Collected from passengers (PHP)",
        "Fares owed to company (PHP)",
        "SeatPass earnings (PHP)",
        "Refunded payments",
        "Refunded amount (PHP)",
      ],
      [
        ...data.by_operator.map((o) => [
          o.operator_name,
          o.transactions,
          o.seats,
          money(o.collected),
          money(o.operator_share),
          money(o.seatpass_earnings),
          o.refunded_count,
          money(o.refunded_amount),
        ]),
        [
          "Total",
          data.totals.transactions,
          data.totals.seats,
          money(data.totals.collected),
          money(data.totals.operator_share),
          money(data.totals.seatpass_earnings),
          data.totals.refunded_count,
          money(data.totals.refunded_amount),
        ],
      ],
    );
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-2">
      <PageHeader
        title="Earnings"
        description="SeatPass's own income from booking fees, apart from the fares that go to bus companies"
        action={
          <Button
            variant="outline"
            className="bg-white"
            onClick={exportCsv}
            disabled={!data || data.by_operator.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <RangeControls state={rangeState} />

      {error && <ErrorState title="Couldn't load earnings" message={error.message} onRetry={() => void refetch()} />}

      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", isFetching && !isLoading && "opacity-70")}>
        <StatTile
          index={0}
          label="SeatPass earnings"
          value={peso(totals?.seatpass_earnings ?? 0)}
          note={`${peso(fee)} × ${count(totals?.transactions ?? 0)} paid reservations`}
          icon={PiggyBank}
          tone="emerald"
          loading={isLoading}
        />
        <StatTile
          index={1}
          label="Collected from passengers"
          value={peso(totals?.collected ?? 0)}
          note={`${count(totals?.seats ?? 0)} seats sold`}
          icon={ReceiptText}
          tone="teal"
          loading={isLoading}
        />
        <StatTile
          index={2}
          label="Fares owed to bus companies"
          value={peso(totals?.operator_share ?? 0)}
          note={`${count(data?.by_operator.length ?? 0)} companies with sales`}
          icon={Building2}
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
          Each paid reservation is the fares plus a {peso(fee)} SeatPass booking fee. The fares belong to the bus
          company and the fee is SeatPass's. These figures are before the payment provider's charges. Refunds are
          not counted in either share. Dates follow Philippine time.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">SeatPass earnings by {group}</CardTitle>
          <p className="text-xs text-slate-500">
            {dayLabel(range.from, true)} – {dayLabel(range.to, true)}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState title="No paid reservations in this period" description="Try a longer date range." icon={<PiggyBank />} />
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
                    formatter={(v: number) => [peso(v), "SeatPass earnings"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Bar
                    dataKey="seatpass_earnings"
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

      {data && data.by_operator.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold text-slate-900">By bus company</CardTitle>
            <p className="text-xs text-slate-500">What each company sold, what it is owed, and what SeatPass earned</p>
          </CardHeader>
          <div className="overflow-x-auto p-4">
            <table className="data-table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3 text-right">Reservations</th>
                  <th className="px-4 py-3 text-right">Seats</th>
                  <th className="px-4 py-3 text-right">Collected</th>
                  <th className="px-4 py-3 text-right">Fares owed</th>
                  <th className="px-4 py-3 text-right">SeatPass earnings</th>
                  <th className="px-4 py-3 text-right">Refunded</th>
                </tr>
              </thead>
              <tbody>
                {data.by_operator.map((o) => (
                  <tr key={o.operator_id ?? "unknown"} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{o.operator_name}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{count(o.transactions)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{count(o.seats)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{peso(o.collected)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{peso(o.operator_share)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{peso(o.seatpass_earnings)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {o.refunded_count ? `${peso(o.refunded_amount)} (${o.refunded_count})` : "—"}
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
                  <td className="px-4 py-3 text-right">{peso(data.totals.operator_share)}</td>
                  <td className="px-4 py-3 text-right text-primary-800">{peso(data.totals.seatpass_earnings)}</td>
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
