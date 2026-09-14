"use client";

import {
  Users,
  Bus,
  UserCog,
  CalendarDays,
  Map,
  DollarSign,
  Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/lib/api-hooks";

function StatCard({
  title,
  value,
  icon,
  loading,
  format,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading: boolean;
  format?: (v: number) => string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <div className="text-slate-400">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold text-slate-900">
            {typeof value === "number" && format ? format(value) : value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time fleet and operations overview.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load dashboard stats. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Operators"
          value={stats?.total_operators ?? 0}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Active Operators"
          value={stats?.active_operators ?? 0}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Total Buses"
          value={stats?.total_buses ?? 0}
          icon={<Bus className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Active Buses"
          value={stats?.active_buses ?? 0}
          icon={<Bus className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Maintenance Buses"
          value={stats?.maintenance_buses ?? 0}
          icon={<Bus className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Total Drivers"
          value={stats?.total_drivers ?? 0}
          icon={<UserCog className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Today's Scheduled Trips"
          value={stats?.today_scheduled_trips ?? 0}
          icon={<CalendarDays className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Active Trips"
          value={stats?.active_trips ?? 0}
          icon={<Map className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Today's Bookings"
          value={stats?.today_bookings ?? 0}
          icon={<Ticket className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Today's Revenue"
          value={stats?.today_revenue ?? 0}
          icon={<DollarSign className="h-4 w-4" />}
          loading={isLoading}
          format={(v) =>
            new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
              maximumFractionDigits: 0,
            }).format(v)
          }
        />
      </div>
    </div>
  );
}
