"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";
import {
  PageHeader,
  Button,
  Input,
  Card,
  EmptyState,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  ConfirmDialog,
  Skeleton,
} from "@/components/ui";
import { useTrips, useCancelTrip } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function SchedulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const { data: trips, isLoading, error } = useTrips({
    status: statusFilter || undefined,
    date: dateFilter || undefined,
  });
  const cancelTrip = useCancelTrip();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = trips?.filter((t) =>
    t.route_id.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCancel = async () => {
    if (!deleteId) return;
    try {
      await cancelTrip.mutateAsync(deleteId);
      toast.success("Trip cancelled");
      setDeleteId(null);
    } catch {
      toast.error("Failed to cancel trip");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedules"
        description="Manage scheduled trips"
        action={
          <Button onClick={() => navigate("/schedules")}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Trip
          </Button>
        }
      />

      <Card>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search routes..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="departed">Departed</option>
            <option value="arrived">Arrived</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Input
            type="date"
            className="w-48"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600">Failed to load trips.</div>
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
          <EmptyState
            title="No trips found"
            description="Schedule a trip to get started."
          />
        )}

        {!isLoading && !error && filtered && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Departure</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Seats</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {t.route_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(t.scheduled_departure).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                        t.status === "departed" ? "border-transparent bg-emerald-100 text-emerald-700" :
                        t.status === "cancelled" ? "border-transparent bg-red-100 text-red-700" :
                        "border-transparent bg-slate-100 text-slate-700"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(t.price)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.available_seats}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/schedules/${t.id}`)}>
                            View details
                          </DropdownMenuItem>
                          {t.status === "scheduled" && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteId(t.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Cancel trip"
        description="This scheduled trip will be cancelled. Are you sure?"
        confirmLabel="Cancel trip"
        onConfirm={handleCancel}
        loading={cancelTrip.isPending}
      />
    </div>
  );
}
