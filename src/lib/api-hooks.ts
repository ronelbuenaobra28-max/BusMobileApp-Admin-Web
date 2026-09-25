import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  DashboardStats,
  Operator,
  Bus,
  Driver,
  Route,
  Trip,
  Terminal,
  AdminNotificationTestResponse,
  AnalyticsReservations,
  AnalyticsRevenue,
  AnalyticsBookingStatus,
  AnalyticsOperators,
  AnalyticsFleet,
  AdminSettings,
  SettingOut,
  User,
  RouteGeometry,
  RefreshRouteGeometryResponse,
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
      api.post<{ success: boolean }>(`/api/admin/operators/${id}/deactivate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "operators"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useDeleteOperator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del<void>(`/api/admin/operators/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "operators"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useBulkDeleteOperators() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post<{
        deleted_ids: string[];
        blocked: { id: string; reason: string }[];
        not_found: string[];
        deleted_count: number;
        blocked_count: number;
        not_found_count: number;
      }>("/api/admin/operators/bulk-delete", { operator_ids: ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "operators"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useBulkDeactivateOperators() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post<{
        deactivated_ids: string[];
        already_inactive_ids: string[];
        not_found: string[];
        deactivated_count: number;
      }>("/api/admin/operators/bulk-deactivate", { operator_ids: ids }),
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
    mutationFn: (body: { user_id: string; license_no: string }) =>
      api.post<Driver>("/api/admin/drivers", body),
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
      body: Partial<{ name: string; license_no: string; status: string }>;
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
      api.del<void>(`/api/admin/drivers/${id}`),
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
    mutationFn: (body: { name: string; origin: string; destination: string; origin_terminal_id?: string | null; destination_terminal_id?: string | null; operator_ids?: string[] }) =>
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
      body: Partial<{ name: string; origin: string; destination: string; origin_terminal_id: string | null; destination_terminal_id: string | null; operator_ids: string[] }>;
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
      api.del<void>(`/api/admin/routes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "routes"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useRefreshRouteGeometry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) =>
      api.post<RefreshRouteGeometryResponse>(`/api/admin/routes/${routeId}/refresh-geometry`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "routes"] });
      qc.invalidateQueries({ queryKey: ["admin", "route-geometry"] });
    },
  });
}

export function useRouteGeometry(routeId: string) {
  return useQuery({
    queryKey: ["admin", "route-geometry", routeId],
    queryFn: () => api.get<RouteGeometry>(`/api/admin/routes/${routeId}/geometry`),
    enabled: !!routeId,
  });
}

export function useTrips(filters?: {
  status?: string;
  date?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.date) qs.set("date", filters.date);
  if (filters?.q) qs.set("q", filters.q);
  const qsStr = qs.toString();
  const path = `/api/admin/trips${qsStr ? `?${qsStr}` : ""}`;
  return useQuery({
    queryKey: ["admin", "trips", filters],
    queryFn: () => api.get<Trip[]>(path),
  });
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: ["admin", "trips", tripId],
    queryFn: () => api.get<Trip>(`/api/admin/trips/${tripId}`),
    enabled: !!tripId,
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

export function useSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<AdminSettings>("/api/admin/settings"),
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put<SettingOut>(`/api/admin/settings/${key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export function useUsers(filters?: { q?: string; role?: string }) {
  const qs = new URLSearchParams();
  if (filters?.q) qs.set("q", filters.q);
  if (filters?.role) qs.set("role", filters.role);
  const qsStr = qs.toString();
  const path = `/api/admin/users${qsStr ? `?${qsStr}` : ""}`;
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => api.get<User[]>(path),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => api.get<User>(`/api/admin/users/${userId}`),
    enabled: !!userId,
  });
}
