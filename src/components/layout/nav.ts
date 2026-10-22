import {
  Bell,
  Bus,
  CalendarDays,
  IdCard,
  LayoutDashboard,
  MapPin,
  ReceiptText,
  Route,
  Settings,
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
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** The one source for the sidebar, the mobile drawer and the header title. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
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

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** The nav group a nav item sits in. */
export function groupOf(item: NavItem): NavGroup | undefined {
  return NAV_GROUPS.find((g) => g.items.includes(item));
}

/** The nav entry a path belongs to: exact match first, then the longest prefix
 *  (so /buses/123 resolves to Buses). */
export function navItemFor(pathname: string): NavItem | undefined {
  const exact = ALL_ITEMS.find((i) => i.to === pathname);
  if (exact) return exact;
  return ALL_ITEMS.filter((i) => i.to !== "/" && pathname.startsWith(`${i.to}/`)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
}
