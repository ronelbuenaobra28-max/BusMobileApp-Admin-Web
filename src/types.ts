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
  today_revenue: number;
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
}

export interface Stop {
  id: string;
  route_id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  point_type: "origin" | "checkpoint" | "passenger_stop" | "destination";
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
}

export interface Terminal {
  id: string;
  name: string;
  location?: string;
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

export type TripStatus = "scheduled" | "departed" | "arrived" | "cancelled";
export type BusStatus = "active" | "maintenance" | "retired";
export type PointType = "origin" | "checkpoint" | "passenger_stop" | "destination";
