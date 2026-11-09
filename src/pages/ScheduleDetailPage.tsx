"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton, Input, ConfirmDialog } from "@/components/ui";
import { useTrip, useUpdateTrip, useCancelTrip, useRoutes, useDrivers, useBuses } from "@/lib/api-hooks";
import { checkTripNumbers, isoFromManilaInput, manilaInputFromIso, type TripNumberErrors } from "@/lib/trip-form";
import { toast } from "sonner";

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading, error, refetch } = useTrip(id || "");
  const { data: routes } = useRoutes();
  const { data: drivers } = useDrivers();
  const { data: buses } = useBuses();
  const updateTrip = useUpdateTrip();
  const cancelTrip = useCancelTrip();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    price: "",
    available_seats: "",
    scheduled_departure: "",
    status: "",
  });
  const [errors, setErrors] = useState<TripNumberErrors & { scheduled_departure?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const route = routes?.find((r) => r.id === trip?.route_id);
  const driver = drivers?.find((d) => d.id === trip?.driver_id);
  const busCapacity = buses?.find((b) => b.id === trip?.bus_id)?.capacity;

  if (tripLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Trip" description="Trip details" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="space-y-4">
        <PageHeader title="Trip" description="Trip details" action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        } />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            {error ? "Failed to load trip." : "Trip not found."}
            {error && (
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
                Retry
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // The form as first shown, so a save sends only what the admin changed:
  // untouched fields are never rewritten and passengers are only notified
  // of real changes.
  const initialForm = () => ({
    price: String(trip.price),
    available_seats: String(trip.available_seats),
    scheduled_departure: manilaInputFromIso(trip.scheduled_departure),
    status: trip.status,
  });

  const openEdit = () => {
    setEditing(true);
    setErrors({});
    setForm(initialForm());
  };

  const doSave = async () => {
    const next: typeof errors = checkTripNumbers(form.price, form.available_seats, busCapacity);
    if (!form.scheduled_departure) next.scheduled_departure = "Set a departure date/time.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const start = initialForm();
    const body: Record<string, string | number> = {};
    if (form.price !== start.price) body.price = Number(form.price);
    if (form.available_seats !== start.available_seats) body.available_seats = Number(form.available_seats);
    if (form.scheduled_departure !== start.scheduled_departure) {
      body.scheduled_departure = isoFromManilaInput(form.scheduled_departure);
    }
    if (form.status !== start.status) body.status = form.status;
    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      await updateTrip.mutateAsync({ id: trip.id, body });
      toast.success("Trip updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update trip");
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

  const routeLabel = route
    ? `${route.name} (${route.origin} → ${route.destination})`
    : trip.route_id;
  const driverLabel = driver?.full_name ?? trip.driver_id;

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <PageHeader
        title="Trip Details"
        description={trip.id}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <Card>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Route</p>
              <p className="text-lg font-semibold text-slate-900">{routeLabel}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Bus</p>
              <p className="text-lg font-semibold text-slate-900">{trip.bus_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Driver</p>
              <p className="text-lg font-semibold text-slate-900">{driverLabel}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Operator</p>
              <p className="text-lg font-semibold text-slate-900">{trip.operator_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <StatusBadge status={trip.status} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Departure</p>
              <p className="text-lg font-semibold text-slate-900">
                {new Date(trip.scheduled_departure).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Arrival</p>
              <p className="text-lg font-semibold text-slate-900">
                {trip.arrival_time
                  ? new Date(trip.arrival_time).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Price</p>
              <p className="text-lg font-semibold text-slate-900">
                {new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }).format(trip.price)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Available Seats</p>
              <p className="text-lg font-semibold text-slate-900">{trip.available_seats}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {!editing ? (
              <>
                <Button onClick={openEdit}>Edit</Button>
                {trip.status === "scheduled" && (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteId(trip.id)}
                  >
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <form noValidate onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Price</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      aria-invalid={!!errors.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                    {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Available Seats
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      max={busCapacity}
                      value={form.available_seats}
                      aria-invalid={!!errors.available_seats}
                      onChange={(e) =>
                        setForm({ ...form, available_seats: e.target.value })
                      }
                    />
                    {errors.available_seats && <p className="text-xs text-red-600">{errors.available_seats}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Departure (Philippine time)
                    </label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_departure}
                      aria-invalid={!!errors.scheduled_departure}
                      onChange={(e) =>
                        setForm({ ...form, scheduled_departure: e.target.value })
                      }
                    />
                    {errors.scheduled_departure && (
                      <p className="text-xs text-red-600">{errors.scheduled_departure}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      {/* Cancelling refunds and releases every booking, so it
                          only happens through the confirmed Cancel button. */}
                      {trip.status === "cancelled" && (
                        <option value="cancelled" disabled>
                          Cancelled
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-slate-500">To cancel this trip, use the Cancel button.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteId(null);
        }}
        title="Cancel trip"
        description="This trip will be cancelled. Are you sure?"
        confirmLabel="Cancel trip"
        onConfirm={handleCancel}
        loading={cancelTrip.isPending}
      />
    </div>
  );
}
