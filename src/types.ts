export interface DashboardStats {
  total_operators: number;
  active_operators: number;
  total_buses: number;
  active_buses: number;
  maintenance_buses: number;
  total_drivers: number;
  today_scheduled_trips: number;
  active_trips: number;
  today_bookings: number;
  total_revenue: number;
}

export interface AnalyticsReservations {
  year: number;
  months: { month: number; value: number }[];
}

export interface AnalyticsRevenue {
  year: number;
  months: { month: number; value: number }[];
}

export interface AnalyticsBookingStatusItem {
  status: string;
  count: number;
}

export interface AnalyticsBookingStatus {
  items: AnalyticsBookingStatusItem[];
}

export interface AnalyticsOperatorItem {
  id: string;
  name: string;
  reservations: number;
  trips: number;
}

export interface AnalyticsOperators {
  items: AnalyticsOperatorItem[];
}

export interface AnalyticsFleet {
  total_buses: number;
  active_buses: number;
  maintenance_buses: number;
  retired_buses: number;
  active_trips: number;
}

export interface Operator {
  id: string;
  name: string;
  active: "active" | "inactive";
}

export interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  status: "active" | "maintenance" | "retired";
  current_route_id: string | null;
  operator_id: string | null;
}

export interface Driver {
  id: string;
  user_id: string;
  license_no: string;
  status: string;
  full_name: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  operators: OperatorAssignment[];
  origin_terminal_id: string | null;
  origin_terminal_name: string | null;
  origin_terminal_city: string | null;
  origin_terminal_lat: number | null;
  origin_terminal_lng: number | null;
  destination_terminal_id: string | null;
  destination_terminal_name: string | null;
  destination_terminal_city: string | null;
  destination_terminal_lat: number | null;
  destination_terminal_lng: number | null;
}

export interface OperatorAssignment {
  operator_id: string;
  operator_name: string;
}

export interface GeocodingResult {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeType: string;
}

export interface Stop {
  id: string;
  route_id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  point_type: "origin" | "checkpoint" | "passenger_stop" | "destination";
  distance_from_origin_km: number | null;
}

export interface RouteGeometry {
  route_id: string;
  distance_km: number | null;
  /** GeoJSON coordinate pairs: [longitude, latitude] */
  coordinates: [number, number][];
  stops: Stop[];
}

export interface RefreshRouteGeometryResponse {
  route_id: string;
  distance_km: number | null;
  coordinate_count: number;
  stops_generated: number;
  stop_count: number;
  stop_generation_warning: string | null;
}

export interface Trip {
  id: string;
  route_id: string;
  bus_id: string;
  driver_id: string;
  scheduled_departure: string;
  actual_departure: string | null;
  status: string;
  price: number;
  available_seats: number;
  arrival_time: string | null;
  bus_number: string;
  operator_id: string | null;
  operator_name: string | null;
}

export interface Terminal {
  id: string;
  name: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface AdminNotificationTestResponse {
  success: boolean;
  message_id: string | null;
  tokens_targeted: number;
}

export interface FleetStats {
  total_buses: number;
  active_trips: number;
  total_bookings_today: number;
  revenue_today: number;
}

export type TripStatus = "scheduled" | "active" | "completed" | "cancelled";
export type BusStatus = "active" | "maintenance" | "retired";
export type PointType = "origin" | "checkpoint" | "passenger_stop" | "destination";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  role: string;
  birthdate: string | null;
  gender: string | null;
  verification_id_type: string | null;
  verification_status: string | null;
  consent_given: boolean;
  terms_version: string | null;
  privacy_policy_version: string | null;
  created_at: string;
}

export interface AdminSettings {
  booking_hold_minutes: number;
  reminder_window_hours: number;
}

export interface SettingOut {
  key: string;
  value: number | string;
  updated_at: string | null;
}
