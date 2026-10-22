"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { useDrivers, useRoutes, useTrips, useRemoveDriver } from "@/lib/api-hooks";
import { toast } from "sonner";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: drivers, isLoading: loadingDrivers } = useDrivers();
  const { data: trips } = useTrips();
  const { data: routes } = useRoutes();
  const routeLabel = (routeId: string) => {
    const r = routes?.find((route) => route.id === routeId);
    return r ? `${r.origin} → ${r.destination}` : "Unknown route";
  };
  const removeDriver = useRemoveDriver();

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

  const handleDeactivate = async () => {
    try {
      await removeDriver.mutateAsync(driver.id);
      toast.success("Driver deactivated");
      navigate("/drivers");
    } catch {
      toast.error("Failed to deactivate driver");
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <PageHeader
        title={driver.full_name}
        description={
          <StatusBadge status={driver.status} />
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/drivers")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {driver.status !== "off_duty" && (
              <Button variant="destructive" onClick={handleDeactivate}>
                Deactivate
              </Button>
            )}
          </div>
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
              <table className="data-table w-full text-sm">
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
                      <td className="px-3 py-2 text-slate-900">{routeLabel(t.route_id)}</td>
                      <td className="px-3 py-2 text-slate-900">
                        {new Date(t.scheduled_departure).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={t.status} />
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
