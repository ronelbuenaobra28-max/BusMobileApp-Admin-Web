"use client";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { useDrivers, useTrips } from "@/lib/api-hooks";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: drivers, isLoading: loadingDrivers } = useDrivers();
  const { data: trips } = useTrips();

  const driver = drivers?.find((d) => d.id === id);
  const driverTrips = trips?.filter((t) => t.driver_id === id) ?? [];

  if (loadingDrivers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-4">
        <PageHeader title="Driver" description="Driver details" />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            Driver not found.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.full_name}
        description={
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${
            driver.status === "active" ? "border-transparent bg-emerald-100 text-emerald-700" : "border-transparent bg-slate-100 text-slate-700"
          }`}>
            {driver.status}
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
            <p className="text-sm text-slate-500">License No</p>
            <p className="text-lg font-semibold text-slate-900">{driver.license_no}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">User ID</p>
            <p className="text-lg font-semibold text-slate-900">{driver.user_id}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Trips</p>
            <p className="text-2xl font-bold text-slate-900">{driverTrips.length}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Trips</h3>
          {driverTrips.length === 0 ? (
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
                  {driverTrips.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-900">{t.route_id}</td>
                      <td className="px-3 py-2 text-slate-900">
                        {new Date(t.scheduled_departure).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium border-transparent bg-slate-100 text-slate-700`}>
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
