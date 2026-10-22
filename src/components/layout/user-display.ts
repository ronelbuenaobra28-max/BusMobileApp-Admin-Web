import type { AdminProfile } from "@/contexts/AuthContext";

/** "First Last", else first name, else email, else "Admin". */
export function displayName(profile: AdminProfile | null) {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  return profile?.first_name || profile?.email || "Admin";
}

/** Up to two initials for an avatar ("Ronel Buenaobra" -> "RB"). */
export function initials(name: string) {
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "A"
  );
}
