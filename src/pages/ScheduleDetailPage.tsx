"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton, Input, ConfirmDialog } from "@/components/ui";
import { useTrips, useUpdateTrip, useCancelTrip } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trips, isLoading } = useTrips();
  const updateTrip = useUpdateTrip();
  const cancelTrip = useCancelTrip();
  const trip = trips?.find((t) => t.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    price: "",
    available_seats: "",
    scheduled_departure: "",
    status: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-4">
        <PageHeader title="Trip" description="Trip details" />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            Trip not found.
          </div>
        </Card>
      </div>
    );
  }

  const openEdit = () => {
    setEditing(true);
    setForm({
      price: String(trip.price),
      available_seats: String(trip.available_seats),
      scheduled_departure: trip.scheduled_departure.slice(0, 16),
      status: trip.status,
    });
  };

  const doSave = async () => {
    setSubmitting(true);
    try {
      await updateTrip.mutateAsync({
        id: trip.id,
        body: {
          price: Number(form.price),
          available_seats: Number(form.available_seats),
          scheduled_departure: new Date(form.scheduled_departure).toISOString(),
          status: form.status,
        },
      });
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

  return (
    <div className="space-y-6">
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
              <p className="text-lg font-semibold text-slate-900">{trip.route_id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Bus</p>
              <p className="text-lg font-semibold text-slate-900">{trip.bus_id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Driver</p>
              <p className="text-lg font-semibold text-slate-900">{trip.driver_id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                trip.status === "active" ? "border-transparent bg-emerald-100 text-emerald-700" :
                trip.status === "cancelled" ? "border-transparent bg-red-100 text-red-700" :
                "border-transparent bg-slate-100 text-slate-700"
              }`}>
                {trip.status}
              </span>
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
              <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Price</label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Available Seats
                    </label>
                    <Input
                      type="number"
                      value={form.available_seats}
                      onChange={(e) =>
                        setForm({ ...form, available_seats: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Departure
                    </label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_departure}
                      onChange={(e) =>
                        setForm({ ...form, scheduled_departure: e.target.value })
                      }
                    />
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
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
