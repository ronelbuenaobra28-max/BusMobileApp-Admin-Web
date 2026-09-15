import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  DashboardStats,
  Operator,
  Bus,
  Driver,
  Route,
  Stop,
  Trip,
  Terminal,
  AdminNotificationTestResponse,
  PointType,
  AnalyticsReservations,
  AnalyticsRevenue,
  AnalyticsBookingStatus,
  AnalyticsOperators,
  AnalyticsFleet,
  RouteGeometry,
} from "@/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get<DashboardStats>("/api/admin/dashboard/stats"),
  });
}

export function useOperators() {
  return useQuery({
    queryKey: ["admin", "operators"],
    queryFn: () => api.get<Operator[]>("/api/admin/operators"),
  });
}

export function useCreateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      api.post<Operator>("/api/admin/operators", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "operators"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ name: string; active: string }> }) =>
      api.put<Operator>(`/api/admin/operators/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "operators"] });
    },
  });
}

export function useDeactivateOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<{ success: boolean }>(`/api/admin/operators/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "operators"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useBuses() {
  return useQuery({
    queryKey: ["admin", "buses"],
    queryFn: () => api.get<Bus[]>("/api/admin/buses"),
  });
}

export function useCreateBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      bus_number: string;
      capacity: number;
      status?: string;
      operator_id?: string | null;
    }) => api.post<Bus>("/api/admin/buses", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "buses"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{
        bus_number: string;
        capacity: number;
        status: string;
        operator_id: string | null;
      }>;
    }) => api.put<Bus>(`/api/admin/buses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "buses"] });
    },
  });
}

export function useRetireBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<{ success: boolean }>(`/api/admin/buses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "buses"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useDrivers() {
  return useQuery({
    queryKey: ["admin", "drivers"],
    queryFn: () => api.get<Driver[]>("/api/admin/drivers"),
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      full_name: string;
      license_no: string;
      user_id?: string;
    }) => api.post<Driver>("/api/admin/drivers", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "drivers"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{ full_name: string; license_no: string; status: string }>;
    }) => api.put<Driver>(`/api/admin/drivers/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "drivers"] });
    },
  });
}

export function useRemoveDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<{ success: boolean }>(`/api/admin/drivers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "drivers"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useRoutes() {
  return useQuery({
    queryKey: ["admin", "routes"],
    queryFn: () => api.get<Route[]>("/api/admin/routes"),
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; origin: string; destination: string }) =>
      api.post<Route>("/api/admin/routes", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "routes"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{ name: string; origin: string; destination: string }>;
    }) => api.put<Route>(`/api/admin/routes/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "routes"] });
    },
  });
}

export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<{ success: boolean }>(`/api/admin/routes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "routes"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useRouteGeometry(routeId: string) {
  return useQuery({
    queryKey: ["admin", "routes", routeId, "geometry"],
    queryFn: () => api.get<RouteGeometry>(`/api/admin/routes/${routeId}/geometry`),
    enabled: !!routeId,
  });
}

export function useRouteStops(routeId: string) {
  return useQuery({
    queryKey: ["admin", "routes", routeId, "stops"],
    queryFn: () => api.get<Stop[]>(`/api/admin/routes/${routeId}/stops`),
    enabled: !!routeId,
  });
}

export function useAddStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routeId,
      body,
    }: {
      routeId: string;
      body: {
        name: string;
        latitude: number;
        longitude: number;
        sequence: number;
        point_type: PointType;
      };
    }) => api.post<Stop>(`/api/admin/routes/${routeId}/stops`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["admin", "routes", vars.routeId, "stops"],
      });
    },
  });
}

export function useUpdateStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routeId,
      stopId,
      body,
    }: {
      routeId: string;
      stopId: string;
      body: Partial<{
        name: string;
        latitude: number;
        longitude: number;
        sequence: number;
        point_type: PointType;
      }>;
    }) =>
      api.put<Stop>(`/api/admin/routes/${routeId}/stops/${stopId}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["admin", "routes", vars.routeId, "stops"],
      });
    },
  });
}

export function useDeleteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routeId,
      stopId,
    }: {
      routeId: string;
      stopId: string;
    }) =>
      api.del<{ success: boolean }>(
        `/api/admin/routes/${routeId}/stops/${stopId}`,
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["admin", "routes", vars.routeId, "stops"],
      });
    },
  });
}

export function useTrips(filters?: {
  status?: string;
  date?: string;
}) {
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.date) qs.set("date", filters.date);
  const qsStr = qs.toString();
  const path = `/api/admin/trips${qsStr ? `?${qsStr}` : ""}`;
  return useQuery({
    queryKey: ["admin", "trips", filters],
    queryFn: () => api.get<Trip[]>(path),
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      route_id: string;
      bus_id: string;
      driver_id: string;
      scheduled_departure: string;
      price: number;
      available_seats: number;
    }) => api.post<Trip>("/api/admin/trips", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "trips"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{
        route_id: string;
        bus_id: string;
        driver_id: string;
        scheduled_departure: string;
        price: number;
        available_seats: number;
        status: string;
      }>;
    }) => api.put<Trip>(`/api/admin/trips/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "trips"] });
    },
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<{ success: boolean }>(`/api/admin/trips/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "trips"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useTerminals() {
  return useQuery({
    queryKey: ["admin", "terminals"],
    queryFn: () => api.get<Terminal[]>("/api/admin/terminals"),
  });
}

export function useCreateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; location?: string }) =>
      api.post<Terminal>("/api/admin/terminals", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "terminals"] });
    },
  });
}

export function useUpdateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{ name: string; location: string }>;
    }) => api.put<Terminal>(`/api/admin/terminals/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "terminals"] });
    },
  });
}

export function useDeleteTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<{ success: boolean }>(`/api/admin/terminals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "terminals"] });
    },
  });
}

export function useAdminNotificationTest() {
  return useMutation({
    mutationFn: (body?: { title?: string; body?: string }) =>
      api.post<AdminNotificationTestResponse>("/api/admin/notifications/test", body ?? {}),
  });
}

export function useAnalyticsReservations(year?: number) {
  return useQuery({
    queryKey: ["analytics", "reservations", year],
    queryFn: () => api.get<AnalyticsReservations>(`/api/admin/analytics/reservations${year ? `?year=${year}` : ""}`),
  });
}

export function useAnalyticsRevenue(year?: number) {
  return useQuery({
    queryKey: ["analytics", "revenue", year],
    queryFn: () => api.get<AnalyticsRevenue>(`/api/admin/analytics/revenue${year ? `?year=${year}` : ""}`),
  });
}

export function useAnalyticsBookingStatus() {
  return useQuery({
    queryKey: ["analytics", "booking-status"],
    queryFn: () => api.get<AnalyticsBookingStatus>("/api/admin/analytics/booking-status"),
  });
}

export function useAnalyticsOperators() {
  return useQuery({
    queryKey: ["analytics", "operators"],
    queryFn: () => api.get<AnalyticsOperators>("/api/admin/analytics/operators"),
  });
}

export function useAnalyticsFleet() {
  return useQuery({
    queryKey: ["analytics", "fleet"],
    queryFn: () => api.get<AnalyticsFleet>("/api/admin/analytics/fleet"),
  });
}
