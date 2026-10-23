import { createContext, useContext } from "react";
import { ADMIN_NAV, PARTNER_NAV, type NavGroup } from "./nav";

/** What differs between the admin console and the Partner Portal shell. */
export interface ConsoleConfig {
  nav: NavGroup[];
  /** Chip next to the SeatPass logo. */
  badge: string;
  /** Second line under the signed-in name (e.g. the bus company). */
  subtitle?: string;
  showNotifications: boolean;
}

export const ADMIN_CONSOLE: ConsoleConfig = {
  nav: ADMIN_NAV,
  badge: "Admin",
  showNotifications: true,
};

export const PARTNER_CONSOLE: ConsoleConfig = {
  nav: PARTNER_NAV,
  badge: "Partner",
  showNotifications: false,
};

export const ConsoleContext = createContext<ConsoleConfig>(ADMIN_CONSOLE);

export function useConsole() {
  return useContext(ConsoleContext);
}
