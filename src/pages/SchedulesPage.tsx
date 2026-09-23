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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useTrips, useCreateTrip, useCancelTrip, useRoutes, useBuses, useDrivers } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function SchedulesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const { data: trips, isLoading, error, refetch } = useTrips({
    status: statusFilter || undefined,
    date: dateFilter || undefined,
    q: search || undefined,
  });
  const createTrip = useCreateTrip();
  const cancelTrip = useCancelTrip();
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const { data: drivers } = useDrivers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    route_id: "",
    bus_id: "",
    driver_id: "",
    scheduled_departure: "",
    arrival_time: "",
    price: "",
    available_seats: "",
  });
  const [errors, setErrors] = useState<{
    route_id?: string;
    bus_id?: string;
    driver_id?: string;
    scheduled_departure?: string;
    price?: string;
    available_seats?: string;
  }>({});

  const tripsToRender = trips ?? [];

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.route_id) next.route_id = "Select a route.";
    if (!form.bus_id) next.bus_id = "Select a bus.";
    if (!form.driver_id) next.driver_id = "Select a driver.";
    if (!form.scheduled_departure) next.scheduled_departure = "Set a departure date/time.";
    if (form.price === "" || Number(form.price) < 0) next.price = "Enter a valid price.";
    if (form.available_seats === "" || Number(form.available_seats) < 0) next.available_seats = "Enter a valid seat count.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openCreate = () => {
    setForm({
      route_id: "",
      bus_id: "",
      driver_id: "",
      scheduled_departure: "",
      arrival_time: "",
      price: "",
      available_seats: "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const doCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createTrip.mutateAsync({
        route_id: form.route_id,
        bus_id: form.bus_id,
        driver_id: form.driver_id,
        scheduled_departure: new Date(form.scheduled_departure).toISOString(),
        price: Number(form.price),
        available_seats: Number(form.available_seats),
        ...(form.arrival_time ? { arrival_time: new Date(form.arrival_time).toISOString() } : {}),
      });
      toast.success("Trip scheduled");
      setDialogOpen(false);
      setForm({
        route_id: "",
        bus_id: "",
        driver_id: "",
        scheduled_departure: "",
        arrival_time: "",
        price: "",
        available_seats: "",
      });
      setErrors({});
    } catch {
      toast.error("Failed to schedule trip");
    } finally {
      setSubmitting(false);
    }
  };

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

  const selectedRoute = routes?.find((r) => r.id === form.route_id);
  const selectedBus = buses?.find((b) => b.id === form.bus_id);
  const selectedDriver = drivers?.find((d) => d.id === form.driver_id);

  const canSubmit =
    form.route_id &&
    form.bus_id &&
    form.driver_id &&
    form.scheduled_departure &&
    form.price !== "" &&
    form.available_seats !== "" &&
    !submitting;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedules"
        description="Manage scheduled trips"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Trip
          </Button>
        }
      />

      <Card>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search route, bus, driver, or operator..."
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
            <option value="active">Active</option>
            <option value="completed">Completed</option>
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
          <div className="p-4 text-sm text-red-600">
            Failed to load trips.
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && tripsToRender.length === 0 && (
          <EmptyState
            title="No trips found"
            description="Schedule a trip to get started."
          />
        )}

        {!isLoading && !error && tripsToRender.length > 0 && (
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
                {tripsToRender.map((t) => (
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
                        t.status === "active" ? "border-transparent bg-emerald-100 text-emerald-700" :
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Trip</DialogTitle>
            <DialogDescription>Fill in the trip details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="route_id">Route</Label>
              <Select
                value={form.route_id}
                onValueChange={(value) => setForm((f) => ({ ...f, route_id: value }))}
              >
                <SelectTrigger id="route_id">
                  <SelectValue placeholder={selectedRoute ? `${selectedRoute.name} (${selectedRoute.origin} → ${selectedRoute.destination})` : "Select route"} />
                </SelectTrigger>
                <SelectContent>
                  {routes?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.origin} → {r.destination})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.route_id && <p className="text-xs text-red-600">{errors.route_id}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="bus_id">Bus</Label>
              <Select
                value={form.bus_id}
                onValueChange={(value) => setForm((f) => ({ ...f, bus_id: value }))}
              >
                <SelectTrigger id="bus_id">
                  <SelectValue placeholder={selectedBus ? `${selectedBus.bus_number} (cap. ${selectedBus.capacity})` : "Select bus"} />
                </SelectTrigger>
                <SelectContent>
                  {buses?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bus_number} (cap. {b.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bus_id && <p className="text-xs text-red-600">{errors.bus_id}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="driver_id">Driver</Label>
              <Select
                value={form.driver_id}
                onValueChange={(value) => setForm((f) => ({ ...f, driver_id: value }))}
              >
                <SelectTrigger id="driver_id">
                  <SelectValue placeholder={selectedDriver ? selectedDriver.full_name : "Select driver"} />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.driver_id && <p className="text-xs text-red-600">{errors.driver_id}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="scheduled_departure">Departure</Label>
                <Input
                  id="scheduled_departure"
                  type="datetime-local"
                  value={form.scheduled_departure}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_departure: e.target.value }))}
                />
                {errors.scheduled_departure && <p className="text-xs text-red-600">{errors.scheduled_departure}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="arrival_time">Arrival (optional)</Label>
                <Input
                  id="arrival_time"
                  type="datetime-local"
                  value={form.arrival_time}
                  onChange={(e) => setForm((f) => ({ ...f, arrival_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="price">Price (PHP)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="available_seats">Available Seats</Label>
                <Input
                  id="available_seats"
                  type="number"
                  min="0"
                  value={form.available_seats}
                  onChange={(e) => setForm((f) => ({ ...f, available_seats: e.target.value }))}
                  placeholder="0"
                />
                {errors.available_seats && <p className="text-xs text-red-600">{errors.available_seats}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={doCreate} disabled={!canSubmit}>
              {submitting ? "Saving..." : "Schedule trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
