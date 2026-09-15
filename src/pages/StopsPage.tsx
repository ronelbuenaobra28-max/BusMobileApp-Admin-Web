"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, MapPin } from "lucide-react";
import { PageHeader, Card, Skeleton, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Button } from "@/components/ui";
import { useOperators, useOperatorStats, useOperatorRoutes } from "@/lib/api-hooks";
import type { Operator } from "@/types";

function OperatorCard({ operator, onSelect }: { operator: Operator; onSelect: (operator: Operator) => void }) {
  const { data: stats, isLoading: statsLoading } = useOperatorStats(operator.id);

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onSelect(operator)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{operator.name}</h3>
              <Badge
                variant={operator.active === "active" ? "success" : "secondary"}
                className="mt-1"
              >
                {operator.active}
              </Badge>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{statsLoading ? "—" : `${stats?.bus_count ?? 0} Buses`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{statsLoading ? "—" : `${stats?.route_count ?? 0} Routes`}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OperatorRoutesModal({ operator, onClose }: { operator: Operator; onClose: () => void }) {
  const { data: routes, isLoading } = useOperatorRoutes(operator.id);
  const navigate = useNavigate();

  return (
    <Dialog open={!!operator} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{operator.name} Routes</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <div className="p-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-2 h-4 w-32" />
                  </div>
                </Card>
              ))}
            </div>
          )}
          {!isLoading && (!routes || routes.length === 0) && (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No routes found for this operator.
            </div>
          )}
          {!isLoading && routes && routes.length > 0 && (
            <div className="space-y-3">
              {routes.map((route) => (
                <Card key={route.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">{route.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {route.origin} → {route.destination}
                      </p>
                      {route.distance_km !== null && route.distance_km !== undefined && (
                        <p className="mt-1 text-xs text-slate-500">
                          {route.distance_km.toFixed(1)} km
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate(`/stops/${operator.id}/${route.id}`);
                        onClose();
                      }}
                    >
                      Manage Stops
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StopsPage() {
  const { data: operators, isLoading, error } = useOperators();
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stops"
        description="Select an operator to manage route stops"
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-4 h-4 w-32" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card>
          <div className="p-8 text-center text-sm text-red-600">
            Failed to load operators. Please try again.
          </div>
        </Card>
      )}

      {!isLoading && !error && operators && operators.length === 0 && (
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            No operators found.
          </div>
        </Card>
      )}

      {!isLoading && !error && operators && operators.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {operators.map((operator) => (
            <OperatorCard
              key={operator.id}
              operator={operator}
              onSelect={setSelectedOperator}
            />
          ))}
        </div>
      )}

      <OperatorRoutesModal
        operator={selectedOperator!}
        onClose={() => setSelectedOperator(null)}
      />
    </div>
  );
}
