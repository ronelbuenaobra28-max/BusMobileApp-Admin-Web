"use client";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useTrips } from "@/lib/api-hooks";

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trips, isLoading } = useTrips();
  const trip = trips?.find((t) => t.id === id);

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Route</p>
            <p className="text-lg font-semibold text-slate-900">{trip.route_id}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Bus</p>
            <p className="text-lg font-semibold text-slate-900">{trip.bus_id}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Driver</p>
            <p className="text-lg font-semibold text-slate-900">{trip.driver_id}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Status</p>
            <Badge
              variant={
                trip.status === "departed"
                  ? "success"
                  : trip.status === "cancelled"
                    ? "destructive"
                    : "secondary"
              }
            >
              {trip.status}
            </Badge>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Scheduled Departure</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Date(trip.scheduled_departure).toLocaleString()}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Actual Departure</p>
            <p className="text-lg font-semibold text-slate-900">
              {trip.actual_departure
                ? new Date(trip.actual_departure).toLocaleString()
                : "—"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Arrival</p>
            <p className="text-lg font-semibold text-slate-900">
              {trip.arrival_time
                ? new Date(trip.arrival_time).toLocaleString()
                : "—"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Price</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(trip.price)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Available Seats</p>
            <p className="text-lg font-semibold text-slate-900">{trip.available_seats}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Trip Info</h3>
          <p className="text-sm text-slate-500">
            Live location tracking is available via the tracking API. Use the tracking endpoint
            <code className="ml-2 rounded bg-slate-100 px-2 py-1 text-xs">
              GET /api/tracking/{trip.id}/locations
            </code>
          </p>
        </div>
      </Card>
    </div>
  );
}
