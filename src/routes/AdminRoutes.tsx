import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OperatorsPage from "@/pages/OperatorsPage";
import OperatorDetailPage from "@/pages/OperatorDetailPage";
import BusesPage from "@/pages/BusesPage";
import BusDetailPage from "@/pages/BusDetailPage";
import DriversPage from "@/pages/DriversPage";
import DriverDetailPage from "@/pages/DriverDetailPage";
import RoutesPage from "@/pages/RoutesPage";
import RouteDetailPage from "@/pages/RouteDetailPage";
import RouteStopsPage from "@/pages/RouteStopsPage";
import SchedulesPage from "@/pages/SchedulesPage";
import ScheduleDetailPage from "@/pages/ScheduleDetailPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { initialized, profile, loading } = useAuth();
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }
  if (!profile || profile.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoutes() {
  const { initialized, loading } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="operators" element={<OperatorsPage />} />
        <Route path="operators/:id" element={<OperatorDetailPage />} />
        <Route path="buses" element={<BusesPage />} />
        <Route path="buses/:id" element={<BusDetailPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="drivers/:id" element={<DriverDetailPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="routes/:id" element={<RouteDetailPage />} />
        <Route path="routes/:id/stops" element={<RouteStopsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="schedules/:id" element={<ScheduleDetailPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AdminRoutes;
