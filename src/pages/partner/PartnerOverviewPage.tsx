import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Map, Ticket, Wallet, Armchair } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { LoadBar, StatTile } from "@/components/partner/widgets";
import { usePartnerMe, usePartnerOverview } from "@/lib/partner-hooks";
import { compact, count, dateTime, dayLabel, peso } from "@/lib/format";
import { cn } from "@/lib/utils";

// Recharts animates with JS, so the CSS reduced-motion rule does not reach it.
const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function PartnerOverviewPage() {
  const { data: me } = usePartnerMe();
  const { data, isLoading, error, refetch } = usePartnerOverview();
  const load =
    data && data.next7_capacity > 0 ? Math.round((data.next7_seats_sold / data.next7_capacity) * 100) : 0;

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {me?.first_name ? `Welcome back, ${me.first_name}` : "Overview"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {me?.operator_name ? `${me.operator_name} on SeatPass` : "Your bookings and sales at a glance"}
        </p>
      </div>

      {error && (
        <ErrorState title="Couldn't load your overview" message={error.message} onRetry={() => void refetch()} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          index={0}
          label="Today's ticket sales"
          value={peso(data?.today_ticket_sales ?? 0)}
          note={`${count(data?.today_bookings ?? 0)} paid bookings today`}
          icon={Wallet}
          tone="emerald"
          loading={isLoading}
        />
        <StatTile
          index={1}
          label="This month"
          value={peso(data?.month_ticket_sales ?? 0)}
          note="Ticket sales since the 1st"
          icon={Ticket}
          tone="teal"
          loading={isLoading}
        />
        <StatTile
          index={2}
          label="Seats sold, next 7 days"
          value={`${count(data?.next7_seats_sold ?? 0)} / ${count(data?.next7_capacity ?? 0)}`}
          note={`${load}% of seats on upcoming trips`}
          icon={Armchair}
          tone="sky"
          loading={isLoading}
        />
        <StatTile
          index={3}
          label="Bookings this month"
          value={count(data?.month_bookings ?? 0)}
          note={`${count(data?.month_seats_sold ?? 0)} seats sold`}
          icon={CalendarDays}
          tone="amber"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Ticket sales, last 30 days</CardTitle>
            <p className="text-xs text-slate-500">Your fares from paid online bookings, per day</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !data || data.daily.every((d) => d.ticket_sales === 0) ? (
              <EmptyState
                title="No sales yet"
                description="Paid online bookings for your trips will show here."
                icon={<Wallet />}
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="partnerSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => dayLabel(d)}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
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
                      labelFormatter={(d: string) => dayLabel(d, true)}
                      formatter={(v: number) => [peso(v), "Ticket sales"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ticket_sales"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      fill="url(#partnerSales)"
                      isAnimationActive={!PREFERS_REDUCED_MOTION}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Upcoming departures</CardTitle>
              <p className="mt-1 text-xs text-slate-500">How full your next trips are</p>
            </div>
            <Link
              to="/partner/trips"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary hover:text-primary-800")}
            >
              All trips <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : !data || data.upcoming.length === 0 ? (
              <EmptyState title="No upcoming trips" description="Scheduled trips will appear here." icon={<Map />} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.upcoming.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/partner/bookings?trip=${t.id}`}
                      className="-mx-3 flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {t.origin} → {t.destination}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {dateTime(t.scheduled_departure)} · Bus {t.bus_number}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <StatusBadge status={t.status} />
                      </div>
                      <LoadBar sold={t.seats_sold} capacity={t.capacity} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
