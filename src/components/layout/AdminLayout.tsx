import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { ADMIN_CONSOLE, ConsoleContext, type ConsoleConfig } from "./console";

/** The signed-in shell (sidebar, header, page). The admin console and the
 *  Partner Portal share it and differ only by `config`. */
export default function AdminLayout({ config = ADMIN_CONSOLE }: { config?: ConsoleConfig }) {
  const { pathname } = useLocation();
  return (
    <ConsoleContext.Provider value={config}>
      <div className="flex h-screen min-h-0 bg-slate-50">
        <AdminSidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 min-h-0 overflow-hidden p-4 md:p-6 lg:p-8">
            {/* Keyed by path so each page eases in when you navigate. */}
            <div
              key={pathname}
              className="h-full min-h-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ConsoleContext.Provider>
  );
}
