import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  EarningsReport,
  OperatorStaff,
  OperatorStaffCreated,
  PartnerBookingPage,
  PartnerFleet,
  PartnerMe,
  PartnerOverview,
  PartnerSalesReport,
  PartnerTrip,
} from "@/types";

function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

// ---------------------------------------------------------------------------
// Partner Portal (signed-in operator staff; the API scopes to their company)
// ---------------------------------------------------------------------------
export function usePartnerMe() {
  return useQuery({
    queryKey: ["partner", "me"],
    queryFn: () => api.get<PartnerMe>("/api/partner/me"),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePartnerOverview() {
  return useQuery({
    queryKey: ["partner", "overview"],
    queryFn: () => api.get<PartnerOverview>("/api/partner/overview"),
  });
}

export interface PartnerBookingFilters {
  q?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  trip_id?: string;
  limit?: number;
  offset?: number;
}

export function usePartnerBookings(filters: PartnerBookingFilters) {
  return useQuery({
    queryKey: ["partner", "bookings", filters],
    queryFn: () => api.get<PartnerBookingPage>(`/api/partner/bookings${qs({ ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

export function usePartnerSales(range: { date_from: string; date_to: string; group: "day" | "month" }) {
  return useQuery({
    queryKey: ["partner", "sales", range],
    queryFn: () => api.get<PartnerSalesReport>(`/api/partner/sales${qs(range)}`),
    placeholderData: keepPreviousData,
  });
}

export function usePartnerTrips(scope: "upcoming" | "past") {
  return useQuery({
    queryKey: ["partner", "trips", scope],
    queryFn: () => api.get<PartnerTrip[]>(`/api/partner/trips${qs({ scope })}`),
  });
}

export function usePartnerFleet() {
  return useQuery({
    queryKey: ["partner", "fleet"],
    queryFn: () => api.get<PartnerFleet>("/api/partner/fleet"),
  });
}

// ---------------------------------------------------------------------------
// Admin: staff sign-ins for an operator
// ---------------------------------------------------------------------------
export function useOperatorStaff(operatorId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "operators", operatorId, "staff"],
    queryFn: () => api.get<OperatorStaff[]>(`/api/admin/operators/${operatorId}/staff`),
    enabled: Boolean(operatorId),
  });
}

export function useCreateOperatorStaff(operatorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; first_name: string; last_name: string }) =>
      api.post<OperatorStaffCreated>(`/api/admin/operators/${operatorId}/staff`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "operators", operatorId, "staff"] }),
  });
}

export function useRemoveOperatorStaff(operatorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.del<void>(`/api/admin/operators/${operatorId}/staff/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "operators", operatorId, "staff"] }),
  });
}

// ---------------------------------------------------------------------------
// Admin: SeatPass earnings across every company
// ---------------------------------------------------------------------------
export function useAdminEarnings(range: { date_from: string; date_to: string; group: "day" | "month" }) {
  return useQuery({
    queryKey: ["admin", "earnings", range],
    queryFn: () => api.get<EarningsReport>(`/api/admin/earnings${qs(range)}`),
    placeholderData: keepPreviousData,
  });
}
