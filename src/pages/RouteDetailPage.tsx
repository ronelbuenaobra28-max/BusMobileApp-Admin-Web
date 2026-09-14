"use client";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { useRoutes, useTrips, useRouteStops } from "@/lib/api-hooks";

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: routes, isLoading: loadingRoutes } = useRoutes();
  const { data: trips } = useTrips();
  const { data: stops } = useRouteStops(id ?? "");

  const route = routes?.find((r) => r.id === id);
  const routeTrips = trips?.filter((t) => t.route_id === id) ?? [];

  if (loadingRoutes) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="space-y-4">
        <PageHeader title="Route" description="Route details" />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            Route not found.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={route.name}
        description={
          <span className="text-sm text-slate-500">
            {route.origin} → {route.destination}
          </span>
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/routes/${id}/stops`)}>
              Manage Stops
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Origin</p>
            <p className="text-lg font-semibold text-slate-900">{route.origin}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Destination</p>
            <p className="text-lg font-semibold text-slate-900">{route.destination}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Stops</p>
            <p className="text-2xl font-bold text-slate-900">{stops?.length ?? 0}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Stops</h3>
          {!stops || stops.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No stops yet. Add stops to this route via the stop editor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Coords</th>
                  </tr>
                </thead>
                <tbody>
                  {stops.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-500">{s.sequence}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium border-transparent bg-slate-100 text-slate-700">
                          {s.point_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Trips</h3>
          {routeTrips.length === 0 ? (
            <p className="text-sm text-slate-500">No trips on this route.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">Departure</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                    <th className="px-3 py-2 font-medium">Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {routeTrips.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-900">
                        {new Date(t.scheduled_departure).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium border-transparent bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-900">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(t.price)}
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
