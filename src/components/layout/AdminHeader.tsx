import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import { useState } from "react";

export default function AdminHeader() {
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Admin Console</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
        </button>
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-slate-900">
            {profile?.first_name || profile?.email || "Admin"}
          </p>
          <p className="text-xs text-slate-500 capitalize">{profile?.role ?? "admin"}</p>
        </div>
      </div>
      {mobileOpen && (
        <nav className="absolute left-4 top-16 z-50 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg md:hidden">
          <NavLink to="/" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/operators" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Operators
          </NavLink>
          <NavLink to="/buses" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Buses
          </NavLink>
          <NavLink to="/drivers" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Drivers
          </NavLink>
          <NavLink to="/routes" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Routes
          </NavLink>
          <NavLink to="/schedules" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Schedules
          </NavLink>
          <NavLink to="/trips" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Trips
          </NavLink>
          <NavLink to="/notifications" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Notifications
          </NavLink>
          <NavLink to="/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            Settings
          </NavLink>
        </nav>
      )}
    </header>
  );
}
