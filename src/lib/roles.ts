import type { UserRole } from "@/contexts/AuthContext";

/** Where each role lands after signing in. Roles without a console here
 *  (passengers and drivers use the mobile app) get null. */
export function homePathFor(role: UserRole | undefined | null): string | null {
  if (role === "admin") return "/";
  if (role === "operator") return "/partner";
  return null;
}
