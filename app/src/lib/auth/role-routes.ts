import type { UserRole } from "@/lib/api/auth";

/**
 * Shared surfaces (the impact dashboard) render for every role, so they cannot
 * hardcode a tab group. RoleGate would bounce a merchant off a citizen route.
 */
export function announcementsHref(role: UserRole | undefined) {
  switch (role) {
    case "merchant":
      return "/(merchant)/announcements";
    case "lgu_admin":
      return "/(lgu)/announcements";
    default:
      return "/(citizen)/announcements";
  }
}
