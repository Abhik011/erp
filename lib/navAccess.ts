/**
 * Route access for sidebar (Mongo workspace roles).
 * Super admin / admin see everything. Other roles see role-appropriate sections only.
 */
const ROLE_PATH_PREFIXES: Record<string, readonly string[]> = {
  super_admin: ["*"],
  admin: ["*"],
  /** CRM + pipeline */
  sales: [
    "/dashboard",
    "/leads",
    "/customers",
    "/deals",
    "/quotes",
    "/profile",

  ],
  /** Delivery + collaboration */
  developer: ["/dashboard", "/projects", "/chat",  "/profile",],
  /** Money + reporting */
  finance: [
    "/dashboard",
    "/deals",
    "/leads",
    "/customers",
    "/invoices",
    "/quotes",
    "/reports",
    "/billing",
    "/profile",

    "/chat",
  ],
  manager: [
    "/dashboard",
    "/leads",
    "/customers",
    "/deals",
    "/quotes",
    "/invoices",
    "/reports",
    "/projects",
    "/chat",
    "/profile",
    "/pricing",
  ],
  employee: ["/dashboard", "/projects", "/chat", "/customers", "/profile",],
  viewer: ["/dashboard", "/reports", "/profile", "/pricing"],
};

export function canAccessPath(role: string | undefined, href: string): boolean {
  if (role === undefined) return true;
  const r = role.toLowerCase();
  const prefixes = ROLE_PATH_PREFIXES[r] || ROLE_PATH_PREFIXES.viewer;
  if (prefixes.includes("*")) return true;
  return prefixes.some(
    (p) => href === p || href.startsWith(`${p}/`) || href.startsWith(`${p}?`)
  );
}
