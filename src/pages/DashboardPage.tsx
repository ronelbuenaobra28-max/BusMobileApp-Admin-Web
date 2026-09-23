"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ticket,
  DollarSign,
  Map,
  Bus,
  RefreshCw,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  useTrips,
} from "@/lib/api-hooks";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-medium">Failed to load dashboard data</p>
      <p className="mt-1 text-xs text-red-600">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#10b981",
  boarded: "#3b82f6",
  cancelled: "#ef4444",
  failed: "#ef4444",
  refunded: "#6b7280",
};

type ChartDataPoint = {
  month: number;
  monthLabel: string;
  reservations: number;
  revenue: number;
};

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: reservations, isLoading: reservationsLoading, error: reservationsError } = useAnalyticsReservations(selectedYear);
  const { data: revenue, isLoading: revenueLoading, error: revenueError } = useAnalyticsRevenue(selectedYear);
  const { data: bookingStatus, isLoading: bookingStatusLoading } = useAnalyticsBookingStatus();
  const { data: fleet, isLoading: fleetLoading } = useAnalyticsFleet();
  const { data: activeTrips, isLoading: tripsLoading } = useTrips({ status: "active" });
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["dashboard", "stats"],
      exact: false,
    });
    await queryClient.invalidateQueries({
      queryKey: ["analytics"],
      exact: false,
    });
    await queryClient.invalidateQueries({
      queryKey: ["admin", "trips"],
      exact: false,
    });
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

    return Array.from({ length: 12 }, (_, idx) => ({
      month: idx + 1,
      monthLabel: MONTHS[idx],
      reservations: reservationMap[idx + 1] ?? 0,
      revenue: revenueMap[idx + 1] ?? 0,
    }));
  }, [reservations, revenue]);

  const totalReservations = useMemo(
    () => reservations?.months.reduce((sum, item) => sum + item.value, 0) ?? 0,
    [reservations],
  );

  const totalRevenue = useMemo(
    () => revenue?.months.reduce((sum, item) => sum + item.value, 0) ?? 0,
    [revenue],
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(value);

  const overviewLoading = statsLoading || reservationsLoading || revenueLoading || fleetLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Operations overview and analytics for {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="h-9 w-[120px]">
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
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {hasAnyError && (
        <ErrorState
          message={
            statsError?.message ||
            reservationsError?.message ||
            revenueError?.message ||
            "Please try again."
          }
          onRetry={handleRefresh}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Reservations
            </CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {formatNumber(totalReservations)}
                </div>
                <p className="text-xs text-slate-500">{selectedYear} total</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-slate-500">Lifetime collected</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Trips
            </CardTitle>
            <Map className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {stats?.active_trips ?? 0}
                </div>
                <p className="text-xs text-slate-500">Currently operating</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Fleet Status
            </CardTitle>
            <Bus className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {fleetLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  {fleet?.active_buses ?? 0}/{fleet?.total_buses ?? 0}
                </div>
                <p className="text-xs text-slate-500">Active buses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Reservations Overview
              </CardTitle>
              <p className="text-xs text-slate-500">
                Monthly reservations for {selectedYear}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {reservationsLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : reservationsError ? (
              <EmptyState
                title="Unable to load reservations"
                description="Please try again later."
                icon={<TrendingUp className="h-6 w-6" />}
              />
            ) : totalReservations === 0 ? (
              <EmptyState
                title="No reservation data available"
                description="Reservations for the selected year will appear here."
                icon={<CalendarDays className="h-6 w-6" />}
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reservationsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="monthLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reservations"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#reservationsGradient)"
                      name="Reservations"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Booking Status
            </CardTitle>
            <p className="text-xs text-slate-500">Overall breakdown</p>
          </CardHeader>
          <CardContent>
            {bookingStatusLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="space-y-4">
                {bookingStatus?.items.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] ?? "#64748b" }}
                      />
                      <span className="text-sm capitalize text-slate-700">{item.status}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {formatNumber(item.count)}
                    </span>
                  </div>
                ))}
                {bookingStatus && bookingStatus.items.length === 0 && (
                  <EmptyState
                    title="No booking data"
                    description="Status breakdown will appear here once bookings exist."
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Revenue Overview
              </CardTitle>
              <p className="text-xs text-slate-500">
                Monthly paid revenue for {selectedYear}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : revenueError ? (
              <EmptyState
                title="Unable to load revenue data"
                description="Please try again later."
                icon={<TrendingUp className="h-6 w-6" />}
              />
            ) : totalRevenue === 0 ? (
              <EmptyState
                title="No revenue data available"
                description="Paid revenue for the selected year will appear here."
                icon={<DollarSign className="h-6 w-6" />}
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="monthLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Fleet Status
            </CardTitle>
            <p className="text-xs text-slate-500">Current bus condition</p>
          </CardHeader>
          <CardContent>
            {fleetLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Active", value: fleet?.active_buses ?? 0, color: "bg-emerald-500" },
                  { label: "Maintenance", value: fleet?.maintenance_buses ?? 0, color: "bg-amber-500" },
                  { label: "Retired", value: fleet?.retired_buses ?? 0, color: "bg-slate-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 text-xs text-slate-500">
                  {fleet?.active_trips ?? 0} active trips in progress
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Active Trips
            </CardTitle>
            <p className="text-xs text-slate-500">
              Currently operating trips and their status
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activeTrips && activeTrips.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activeTrips.slice(0, 10).map((trip) => (
                <div
                  key={trip.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      {trip.route_id && `Route ${trip.route_id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Bus {trip.bus_id.slice(0, 8)} · Driver {trip.driver_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 capitalize">
                      {trip.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(trip.scheduled_departure).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active trips"
              description="Active trips will appear here when in progress."
              icon={<Map className="h-6 w-6" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
