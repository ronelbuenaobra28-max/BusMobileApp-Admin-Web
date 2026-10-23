import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Bell, ChevronRight, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarContent } from "./AdminSidebar";
import { displayName, initials } from "./user-display";
import { groupOf, navItemFor } from "./nav";
import { useConsole } from "./console";

export default function AdminHeader() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { nav, showNotifications, subtitle } = useConsole();
  const current = navItemFor(pathname, nav);
  const groupOfCurrent = current ? groupOf(current, nav) : undefined;
  // Skip "Overview › Overview" when the group and page share a name.
  const group = groupOfCurrent?.label === current?.label ? undefined : groupOfCurrent;
  // Deeper than the nav entry (e.g. /buses/123) = a detail page.
  const isDetail = !!current && pathname !== current.to;
  const name = displayName(profile);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogPrimitive.Trigger
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200 md:hidden">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
              <DialogPrimitive.Close
                className="absolute right-3 top-4 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        {/* Pages carry their own <h1>; the header only says where you are. */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          {group && (
            <>
              <span className="hidden text-slate-500 sm:inline">{group.label}</span>
              <ChevronRight aria-hidden className="hidden h-3.5 w-3.5 text-slate-400 sm:inline" />
            </>
          )}
          {current && isDetail ? (
            <>
              <NavLink to={current.to} className="truncate text-slate-600 hover:text-primary">
                {current.label}
              </NavLink>
              <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate font-medium text-slate-900">Details</span>
            </>
          ) : (
            <span className="truncate font-medium text-slate-900" aria-current="page">
              {current?.label ?? "Admin"}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {showNotifications && (
          <NavLink
            to="/notifications"
            title="Notifications"
            aria-label="Notifications"
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-5 w-5" />
          </NavLink>
        )}
        <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{subtitle ?? (profile?.role === "admin" ? "Admin" : profile?.role)}</p>
          </div>
          <div
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-sm font-semibold text-white"
          >
            {initials(name)}
          </div>
        </div>
      </div>
    </header>
  );
}
