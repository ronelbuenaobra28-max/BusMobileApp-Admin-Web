import {
  BarChart3,
  Bell,
  Bus,
  CalendarDays,
  IdCard,
  LayoutDashboard,
  MapPin,
  ReceiptText,
  Route,
  Settings,
  Ticket,
  User,
  UserCog,
  Users,
  Users2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Match the path exactly (for a console's home page). */
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Admin console menu: the sidebar, mobile drawer and breadcrumb read it. */
export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    ],
  },
  {
    label: "Fleet",
    items: [
      { to: "/operators", icon: Users, label: "Operators" },
      { to: "/buses", icon: Bus, label: "Buses" },
      { to: "/drivers", icon: UserCog, label: "Drivers" },
      { to: "/terminals", icon: MapPin, label: "Terminals" },
    ],
  },
  {
    label: "Trips",
    items: [
      { to: "/routes", icon: Route, label: "Routes" },
      { to: "/schedules", icon: CalendarDays, label: "Schedules" },
      { to: "/booking-passengers", icon: Users2, label: "Booking Passengers" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/users", icon: User, label: "Users" },
      { to: "/verification-ids", icon: IdCard, label: "Verification IDs" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payments/reconciliation", icon: ReceiptText, label: "Reconciliation" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/notifications", icon: Bell, label: "Notifications" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

/** Partner Portal menu (bus company staff; read-only pages). */
export const PARTNER_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/partner", icon: LayoutDashboard, label: "Overview", end: true },
    ],
  },
  {
    label: "Reservations",
    items: [
      { to: "/partner/bookings", icon: Ticket, label: "Bookings" },
      { to: "/partner/trips", icon: CalendarDays, label: "Trips" },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/partner/sales", icon: BarChart3, label: "Sales" },
      { to: "/partner/fleet", icon: Bus, label: "Fleet" },
    ],
  },
];

/** The nav group a nav item sits in. */
export function groupOf(item: NavItem, groups: NavGroup[]): NavGroup | undefined {
  return groups.find((g) => g.items.includes(item));
}

/** The nav entry a path belongs to: exact match first, then the longest prefix
 *  (so /buses/123 resolves to Buses). */
export function navItemFor(pathname: string, groups: NavGroup[]): NavItem | undefined {
  const items = groups.flatMap((g) => g.items);
  const exact = items.find((i) => i.to === pathname);
  if (exact) return exact;
  return items
    .filter((i) => i.to !== "/" && pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
}
