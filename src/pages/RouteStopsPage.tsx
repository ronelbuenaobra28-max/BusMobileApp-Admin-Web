"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader, Button, Card, Skeleton, Input, ConfirmDialog } from "@/components/ui";
import { useRoutes, useRouteStops, useAddStop, useUpdateStop, useDeleteStop } from "@/lib/api-hooks";
import { RouteMap } from "@/components/map/RouteMap";
import { toast } from "sonner";
import type { Stop } from "@/types";

export default function RouteStopsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: routes } = useRoutes();
  const { data: stops, isLoading, refetch } = useRouteStops(id ?? "");
  const addStop = useAddStop();
  const updateStop = useUpdateStop();
  const deleteStop = useDeleteStop();
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [deleteStopId, setDeleteStopId] = useState<string | null>(null);
  const [stopForm, setStopForm] = useState<{
    name: string;
    point_type: "origin" | "checkpoint" | "passenger_stop" | "destination";
    sequence: number;
    latitude: number;
    longitude: number;
  }>({
    name: "",
    point_type: "passenger_stop",
    sequence: 1,
    latitude: 0,
    longitude: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const route = routes?.find((r) => r.id === id);
  const sortedStops = useMemo(
    () => [...(stops ?? [])].sort((a, b) => a.sequence - b.sequence),
    [stops],
  );

  const openAddStop = (lngLat: [number, number]) => {
    setEditingStop(null);
    setStopForm({
      name: "",
      point_type: "passenger_stop",
      sequence: (stops?.length ?? 0) + 1,
      latitude: lngLat[1],
      longitude: lngLat[0],
    });
    setSubmitting(false);
  };

  const openEditStop = (stop: Stop) => {
    setEditingStop(stop);
    setStopForm({
      name: stop.name,
      point_type: stop.point_type,
      sequence: stop.sequence,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    setSubmitting(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stopForm.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingStop) {
        await updateStop.mutateAsync({
          routeId: id!,
          stopId: editingStop.id,
          body: stopForm,
        });
        toast.success("Stop updated");
      } else {
        await addStop.mutateAsync({ routeId: id!, body: stopForm });
        toast.success("Stop added");
      }
      setEditingStop(null);
      void refetch();
    } catch {
      toast.error("Failed to save stop");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStopId) return;
    try {
      await deleteStop.mutateAsync({ routeId: id!, stopId: deleteStopId });
      toast.success("Stop deleted");
      setDeleteStopId(null);
      void refetch();
    } catch {
      toast.error("Failed to delete stop");
    }
  };

  const moveStop = async (stop: Stop, direction: "up" | "down") => {
    const currentIndex = sortedStops.findIndex((s) => s.id === stop.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedStops.length) return;
    const targetStop = sortedStops[targetIndex];
    try {
      await updateStop.mutateAsync({
        routeId: id!,
        stopId: stop.id,
        body: { sequence: targetStop.sequence },
      });
      await updateStop.mutateAsync({
        routeId: id!,
        stopId: targetStop.id,
        body: { sequence: stop.sequence },
      });
      toast.success("Stop order updated");
      void refetch();
    } catch {
      toast.error("Failed to reorder stops");
    }
  };

  const pointTypeBadge = (type: string) => {
    return (
      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
        type === "origin" ? "border-transparent bg-emerald-100 text-emerald-700" :
        type === "destination" ? "border-transparent bg-red-100 text-red-700" :
        type === "checkpoint" ? "border-transparent bg-amber-100 text-amber-700" :
        "border-transparent bg-slate-100 text-slate-700"
      }`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Route Stops"
        description={
          route
            ? `Manage stops for ${route.name}`
            : "Manage route stops"
        }
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-700">Map</h3>
              <p className="text-xs text-slate-500">
                Click on the map to add a new stop. Click a marker to edit.
              </p>
            </div>
            <RouteMap
              stops={stops ?? []}
              onAddStop={openAddStop}
              onEditStop={openEditStop}
              readOnly={false}
            />
          </Card>
        </div>

        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-slate-700">
              {editingStop ? "Edit Stop" : "Stop Details"}
            </h3>
            {editingStop ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <Input
                    value={stopForm.name}
                    onChange={(e) =>
                      setStopForm({ ...stopForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm"
                    value={stopForm.point_type}
                    onChange={(e) =>
                      setStopForm({ ...stopForm, point_type: e.target.value as "origin" | "checkpoint" | "passenger_stop" | "destination" })
                    }
                  >
                    <option value="origin">Origin</option>
                    <option value="checkpoint">Checkpoint</option>
                    <option value="passenger_stop">Passenger Stop</option>
                    <option value="destination">Destination</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Sequence
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={stopForm.sequence}
                      onChange={(e) =>
                        setStopForm({
                          ...stopForm,
                          sequence: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={stopForm.latitude}
                      onChange={(e) =>
                        setStopForm({
                          ...stopForm,
                          latitude: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={stopForm.longitude}
                    onChange={(e) =>
                      setStopForm({
                        ...stopForm,
                        longitude: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingStop(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No stop selected. Click a marker on the map or click the map to add a new stop.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-slate-900">All Stops</h3>
        </div>
        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!isLoading && (!stops || stops.length === 0) && (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No stops. Click on the map to add stops.
          </div>
        )}
        {!isLoading && stops && stops.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Distance from origin</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStops.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 text-slate-500">{s.sequence}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3">{pointTypeBadge(s.point_type)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.distance_from_origin_km !== null && s.distance_from_origin_km !== undefined
                        ? `${s.distance_from_origin_km.toFixed(1)} km`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={idx === 0}
                          onClick={() => moveStop(s, "up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={idx === sortedStops.length - 1}
                          onClick={() => moveStop(s, "down")}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditStop(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => setDeleteStopId(s.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteStopId}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteStopId(null);
        }}
        title="Delete stop"
        description="This stop will be permanently removed. Are you sure?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteStop.isPending}
      />
    </div>
  );
}
