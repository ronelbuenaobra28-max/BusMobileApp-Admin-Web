import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  return (
    <div className="flex h-screen min-h-0 bg-slate-50">
      <AdminSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-hidden p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
