"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  PageHeader,
  Input,
  Card,
  EmptyState,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@/components/ui";
import { useBookingPassengers, useOperators } from "@/lib/api-hooks";

export default function BookingPassengersPage() {
  const { data: rows, isLoading, error, refetch } = useBookingPassengers();
  const { data: operators } = useOperators();
  const [search, setSearch] = useState("");
  const [operatorId, setOperatorId] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.first_name.toLowerCase().includes(term) ||
        row.last_name.toLowerCase().includes(term) ||
        row.contact_number.includes(term) ||
        row.seat_no.toLowerCase().includes(term) ||
        row.bus_number?.toLowerCase().includes(term) ||
        row.route_name?.toLowerCase().includes(term) ||
        row.booking_group_id.toLowerCase().includes(term);
      const matchesOperator = !operatorId || row.operator_id === operatorId;
      return matchesSearch && matchesOperator;
    });
  }, [rows, search, operatorId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Booking Passengers"
        description="Passenger details across all bookings"
      />

      <Card>
        <div className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search passengers, seats, buses, routes..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={operatorId}
              onValueChange={(value) => setOperatorId(value === "__all" ? undefined : value)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All Operators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Operators</SelectItem>
                {operators?.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600">
            Failed to load booking passengers.
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState
            title="No passengers found"
            description="Try adjusting your search or operator filter."
          />
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Seat</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {row.first_name} {row.last_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {row.gender === "male" ? "Male" : row.gender === "female" ? "Female" : row.gender || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.contact_number}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-mono text-xs">
                        {row.booking_group_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.seat_no}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.origin && row.destination ? `${row.origin} → ${row.destination}` : row.route_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.scheduled_departure
                        ? new Date(row.scheduled_departure).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.bus_number || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.operator_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                          row.booking_status === "paid"
                            ? "border-transparent bg-emerald-100 text-emerald-700"
                            : row.booking_status === "pending"
                              ? "border-transparent bg-amber-100 text-amber-700"
                              : row.booking_status === "cancelled"
                                ? "border-transparent bg-red-100 text-red-700"
                                : "border-transparent bg-slate-100 text-slate-700"
                        }`}
                      >
                        {row.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
