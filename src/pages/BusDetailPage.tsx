"use client";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { useBuses, useTrips } from "@/lib/api-hooks";

export default function BusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: buses, isLoading: loadingBus } = useBuses();
  const { data: trips } = useTrips();

  const bus = buses?.find((b) => b.id === id);
  const busTrips = trips?.filter((t) => t.bus_id === id) ?? [];

  if (loadingBus) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="space-y-4">
        <PageHeader title="Bus" description="Bus details" />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            Bus not found.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={bus.bus_number}
        description={
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
            bus.status === "active" ? "border-transparent bg-emerald-100 text-emerald-700" :
            bus.status === "maintenance" ? "border-transparent bg-amber-100 text-amber-700" :
            "border-transparent bg-slate-100 text-slate-700"
          }`}>
            {bus.status}
          </span>
        }
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Capacity</p>
            <p className="text-2xl font-bold text-slate-900">{bus.capacity}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Operator</p>
            <p className="text-lg font-semibold text-slate-900">—</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Trips</p>
            <p className="text-2xl font-bold text-slate-900">{busTrips.length}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Trips</h3>
          {busTrips.length === 0 ? (
            <p className="text-sm text-slate-500">No trips assigned.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">Route</th>
                    <th className="px-3 py-2 font-medium">Departure</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Available Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {busTrips.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-900">{t.route_id}</td>
                      <td className="px-3 py-2 text-slate-900">
                        {new Date(t.scheduled_departure).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium border-transparent bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-900">{t.available_seats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
