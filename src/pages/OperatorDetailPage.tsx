"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Button, Card, Skeleton } from "@/components/ui";
import { useOperators, useBuses, useRoutes, useTrips } from "@/lib/api-hooks";
import { OperatorStaffCard } from "@/components/operators/OperatorStaffCard";

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: operators, isLoading: loadingOp } = useOperators();
  const { data: buses } = useBuses();
  const { data: routes } = useRoutes();
  const { data: trips } = useTrips();

  const operator = operators?.find((o) => o.id === id);
  const operatorBuses = useMemo(
    () => buses?.filter((b) => b.operator_id === id) ?? [],
    [buses, id],
  );
  const operatorBusIds = useMemo(
    () => new Set(operatorBuses.map((b) => b.id)),
    [operatorBuses],
  );
  const relatedTrips = useMemo(
    () => trips?.filter((t) => t.bus_id && operatorBusIds.has(t.bus_id)) ?? [],
    [trips, operatorBusIds],
  );
  const relatedRouteIds = useMemo(
    () => new Set(relatedTrips.map((t) => t.route_id).filter((routeId): routeId is string => Boolean(routeId))),
    [relatedTrips],
  );
  const relatedRoutes = useMemo(
    () => routes?.filter((r) => relatedRouteIds.has(r.id)) ?? [],
    [routes, relatedRouteIds],
  );

  if (loadingOp) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="space-y-4">
        <PageHeader title="Operator" description="Operator details" />
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            Operator not found.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <PageHeader
        title={operator.name}
        description={
          <StatusBadge status={operator.active} />
        }
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Buses</p>
            <p className="text-2xl font-bold text-slate-900">{operatorBuses.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Drivers</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Routes</p>
            <p className="text-2xl font-bold text-slate-900">{relatedRoutes.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-slate-500">Trips</p>
            <p className="text-2xl font-bold text-slate-900">{relatedTrips.length}</p>
          </div>
        </Card>
      </div>

      <OperatorStaffCard operatorId={operator.id} operatorName={operator.name} />

      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Buses</h3>
          {operatorBuses.length === 0 ? (
            <p className="text-sm text-slate-500">No buses assigned.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">Bus #</th>
                    <th className="px-3 py-2 font-medium">Capacity</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operatorBuses.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-900">{b.bus_number}</td>
                      <td className="px-3 py-2 text-slate-900">{b.capacity}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={b.status} />
                      </td>
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
