import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerLayout from "@/components/layout/PartnerLayout";
import { homePathFor } from "@/lib/roles";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OperatorsPage from "@/pages/OperatorsPage";
import OperatorDetailPage from "@/pages/OperatorDetailPage";
import BusesPage from "@/pages/BusesPage";
import BusDetailPage from "@/pages/BusDetailPage";
import DriversPage from "@/pages/DriversPage";
import DriverDetailPage from "@/pages/DriverDetailPage";
import UsersPage from "@/pages/UsersPage";
import UserDetailPage from "@/pages/UserDetailPage";
import RoutesPage from "@/pages/RoutesPage";
import RouteDetailPage from "@/pages/RouteDetailPage";
import SchedulesPage from "@/pages/SchedulesPage";
import ScheduleDetailPage from "@/pages/ScheduleDetailPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import BookingPassengersPage from "@/pages/BookingPassengersPage";
import TerminalsPage from "@/pages/TerminalsPage";
import PaymentReconciliationPage from "@/pages/PaymentReconciliationPage";
import VerificationIdsPage from "@/pages/VerificationIdsPage";
import PartnerOverviewPage from "@/pages/partner/PartnerOverviewPage";
import PartnerBookingsPage from "@/pages/partner/PartnerBookingsPage";
import PartnerSalesPage from "@/pages/partner/PartnerSalesPage";
import PartnerTripsPage from "@/pages/partner/PartnerTripsPage";
import PartnerFleetPage from "@/pages/partner/PartnerFleetPage";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status">
      <img src="/seatpass-mark.png" alt="" className="h-12 w-12 rounded-xl animate-pulse motion-reduce:animate-none" />
      <p className="text-sm text-slate-600">Loading SeatPass…</p>
    </div>
  );
}

/** Only `role` may see `children`; anyone else signed in is sent to their own
 *  console (admins to /, operator staff to /partner), everyone else to login. */
function ProtectedRoute({ role, children }: { role: "admin" | "operator"; children: React.ReactNode }) {
  const { initialized, profile, loading } = useAuth();
  if (!initialized || loading) {
    return <LoadingScreen />;
  }
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  if (profile.role !== role) {
    return <Navigate to={homePathFor(profile.role) ?? "/login"} replace />;
  }
  return <>{children}</>;
}

function AdminRoutes() {
  const { initialized, loading } = useAuth();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute role="admin">
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
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="routes/:id" element={<RouteDetailPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="schedules/:id" element={<ScheduleDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="booking-passengers" element={<BookingPassengersPage />} />
        <Route path="terminals" element={<TerminalsPage />} />
        <Route path="payments/reconciliation" element={<PaymentReconciliationPage />} />
        <Route path="verification-ids" element={<VerificationIdsPage />} />
      </Route>
      <Route
        path="/partner"
        element={
          <ProtectedRoute role="operator">
            <PartnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PartnerOverviewPage />} />
        <Route path="bookings" element={<PartnerBookingsPage />} />
        <Route path="sales" element={<PartnerSalesPage />} />
        <Route path="trips" element={<PartnerTripsPage />} />
        <Route path="fleet" element={<PartnerFleetPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AdminRoutes;
