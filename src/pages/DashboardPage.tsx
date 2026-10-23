"use client";

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Map,
  RefreshCw,
  Ticket,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useDashboardStats,
  useAnalyticsReservations,
  useAnalyticsRevenue,
  useAnalyticsBookingStatus,
  useAnalyticsFleet,
  useRoutes,
  useTrips,
} from "@/lib/api-hooks";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

// Brand teal for the charts; stays readable as lines and bars (> 3:1).
const CHART_TEAL = "#0d9488";
const CHART_TEAL_DARK = "#0f766e";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  paid: "bg-emerald-500",
  boarded: "bg-sky-500",
  cancelled: "bg-red-500",
  failed: "bg-red-500",
  refunded: "bg-slate-400",
};

// Recharts animates with JS, so the CSS reduced-motion rule does not reach it.
const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

type ChartDataPoint = {
  month: number;
  monthLabel: string;
  // null for months that have not happened yet, so the line stops instead
  // of diving to zero.
  reservations: number | null;
  revenue: number | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/** One KPI tile: tinted icon, label, big value and a short note. */
function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
  loading,
  index,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "teal" | "emerald" | "sky" | "amber";
  loading: boolean;
  index: number;
}) {
  const tones = {
    teal: "bg-primary-50 text-primary-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;
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
          <p className="text-xs text-slate-500">{note}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: reservations, isLoading: reservationsLoading, error: reservationsError } = useAnalyticsReservations(selectedYear);
  const { data: revenue, isLoading: revenueLoading, error: revenueError } = useAnalyticsRevenue(selectedYear);
  const { data: bookingStatus, isLoading: bookingStatusLoading } = useAnalyticsBookingStatus();
  const { data: fleet, isLoading: fleetLoading } = useAnalyticsFleet();
  const { data: activeTrips, isLoading: tripsLoading } = useTrips({ status: "active" });
  const { data: routes } = useRoutes();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["analytics"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["admin", "trips"], exact: false }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const hasAnyError = statsError || reservationsError || revenueError;

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const reservationMap: Record<number, number> = {};
    const revenueMap: Record<number, number> = {};
    (reservations?.months ?? []).forEach((item) => {
      reservationMap[item.month] = item.value;
    });
    (revenue?.months ?? []).forEach((item) => {
      revenueMap[item.month] = item.value;
    });
    const isFuture = (month: number) => selectedYear === CURRENT_YEAR && month > CURRENT_MONTH;

    return Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1;
      return {
        month,
        monthLabel: MONTHS[idx],
        reservations: isFuture(month) ? null : (reservationMap[month] ?? 0),
        revenue: isFuture(month) ? null : (revenueMap[month] ?? 0),
      };
    });
  }, [reservations, revenue, selectedYear]);

  const totalReservations = useMemo(
    () => reservations?.months.reduce((sum, item) => sum + item.value, 0) ?? 0,
    [reservations],
  );

  const totalRevenue = useMemo(
    () => revenue?.months.reduce((sum, item) => sum + item.value, 0) ?? 0,
    [revenue],
  );

  const bookingTotal = useMemo(
    () => bookingStatus?.items.reduce((sum, item) => sum + item.count, 0) ?? 0,
    [bookingStatus],
  );

  const routeById = useMemo(() => {
    const map: Record<string, { origin: string; destination: string }> = {};
    (routes ?? []).forEach((r) => {
      map[r.id] = { origin: r.origin, destination: r.destination };
    });
    return map;
  }, [routes]);

  const fleetParts = [
    { label: "Active", value: fleet?.active_buses ?? 0, color: "bg-emerald-500" },
    { label: "Maintenance", value: fleet?.maintenance_buses ?? 0, color: "bg-amber-500" },
    { label: "Retired", value: fleet?.retired_buses ?? 0, color: "bg-slate-400" },
  ];
  const fleetTotal = fleet?.total_buses || fleetParts.reduce((s, p) => s + p.value, 0);

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Operations overview and analytics for {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="h-9 w-[120px] bg-white" aria-label="Year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 bg-white" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {hasAnyError && (
        <ErrorState
          title="Failed to load dashboard data"
          message={
            statsError?.message ||
            reservationsError?.message ||
            revenueError?.message ||
            "Please try again."
          }
          onRetry={handleRefresh}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Reservations"
          value={formatNumber(totalReservations)}
          note={`Total in ${selectedYear}`}
          icon={Ticket}
          tone="teal"
          loading={reservationsLoading}
        />
        <StatCard
          index={1}
          label="Collected from passengers"
          value={formatCurrency(totalRevenue)}
          note={`Fares + SeatPass fees in ${selectedYear}`}
          icon={Wallet}
          tone="emerald"
          loading={revenueLoading}
        />
        <StatCard
          index={2}
          label="Today"
          value={`${formatNumber(stats?.today_bookings ?? 0)} bookings`}
          note={`${stats?.today_scheduled_trips ?? 0} trips scheduled · ${stats?.active_trips ?? 0} on the road`}
          icon={CalendarDays}
          tone="sky"
          loading={statsLoading}
        />
        <StatCard
          index={3}
          label="Fleet in service"
          value={`${fleet?.active_buses ?? 0} / ${fleet?.total_buses ?? 0}`}
          note={`${fleet?.maintenance_buses ?? 0} in maintenance`}
          icon={Bus}
          tone="amber"
          loading={fleetLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <SectionTitle title="Reservations" subtitle={`Monthly reservations in ${selectedYear}`} />
          </CardHeader>
          <CardContent>
            {reservationsLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : reservationsError ? (
              <EmptyState
                title="Unable to load reservations"
                description="Please try again later."
                icon={<TrendingUp />}
              />
            ) : totalReservations === 0 ? (
              <EmptyState
                title="No reservation data available"
                description="Reservations for the selected year will appear here."
                icon={<CalendarDays />}
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reservationsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_TEAL} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={CHART_TEAL} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={formatCompact}
                      tick={{ fontSize: 12, fill: "#475569" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value), "Reservations"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Area
                      type="monotone"
                      dataKey="reservations"
                      stroke={CHART_TEAL_DARK}
                      strokeWidth={2.5}
                      fill="url(#reservationsGradient)"
                      name="Reservations"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                      isAnimationActive={!PREFERS_REDUCED_MOTION}
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SectionTitle title="Booking status" subtitle={`${formatNumber(bookingTotal)} bookings overall`} />
          </CardHeader>
          <CardContent>
            {bookingStatusLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : bookingStatus && bookingStatus.items.length === 0 ? (
              <EmptyState
                title="No booking data"
                description="Status breakdown will appear here once bookings exist."
              />
            ) : (
              <ul className="space-y-4">
                {bookingStatus?.items.map((item) => {
                  const pct = bookingTotal ? (item.count / bookingTotal) * 100 : 0;
                  return (
                    <li key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-slate-700">{item.status}</span>
                        <span className="font-medium text-slate-900">
                          {formatNumber(item.count)}
                          <span className="ml-1.5 text-xs font-normal text-slate-500">{pct.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", STATUS_COLORS[item.status] ?? "bg-slate-400")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <SectionTitle title="Collected from passengers" subtitle={`Monthly payments in ${selectedYear}, fares included`} />
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : revenueError ? (
              <EmptyState
                title="Unable to load revenue data"
                description="Please try again later."
                icon={<TrendingUp />}
              />
            ) : totalRevenue === 0 ? (
              <EmptyState
                title="No revenue data available"
                description="Paid revenue for the selected year will appear here."
                icon={<Wallet />}
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tickFormatter={(v: number) => `₱${formatCompact(v)}`}
                      tick={{ fontSize: 12, fill: "#475569" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(13, 148, 136, 0.06)" }}
                      formatter={(value: number) => [formatCurrency(value), "Collected"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar
                      dataKey="revenue"
                      fill={CHART_TEAL_DARK}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                      name="Collected"
                      isAnimationActive={!PREFERS_REDUCED_MOTION}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SectionTitle title="Fleet status" subtitle={`${fleetTotal} buses registered`} />
          </CardHeader>
          <CardContent>
            {fleetLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="space-y-5">
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  {fleetParts.map((p) => (
                    <div
                      key={p.label}
                      className={cn("h-full transition-[width] duration-700 ease-out", p.color)}
                      style={{ width: fleetTotal ? `${(p.value / fleetTotal) * 100}%` : 0 }}
                    />
                  ))}
                </div>
                <ul className="space-y-3">
                  {fleetParts.map((item) => (
                    <li key={item.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2.5 text-slate-700">
                        <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                        {item.label}
                      </span>
                      <span className="font-medium text-slate-900">{formatNumber(item.value)}</span>
                    </li>
                  ))}
                </ul>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {fleet?.active_trips ?? 0} trips in progress right now
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <SectionTitle title="Active trips" subtitle="Trips on the road right now" />
          <Link
            to="/schedules"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary hover:text-primary-800")}
          >
            All schedules <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : activeTrips && activeTrips.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {activeTrips.slice(0, 10).map((trip) => {
                const route = routeById[trip.route_id];
                return (
                  <li key={trip.id}>
                    <Link
                      to={`/schedules/${trip.id}`}
                      className="-mx-3 flex flex-col gap-2 rounded-lg px-3 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                          <Map className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {route ? `${route.origin} → ${route.destination}` : "Route details unavailable"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {[trip.operator_name, trip.bus_number && `Bus ${trip.bus_number}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-[52px] sm:pl-0">
                        <span className="text-xs text-slate-500">
                          Departed{" "}
                          {new Date(trip.actual_departure ?? trip.scheduled_departure).toLocaleString("en-PH", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <StatusBadge status={trip.status} label="On route" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="No active trips"
              description="Active trips will appear here when in progress."
              icon={<Map />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
