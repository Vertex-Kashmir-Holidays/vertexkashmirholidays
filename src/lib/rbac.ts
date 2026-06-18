// Edge-safe RBAC constants & helpers — NO prisma / next-auth server imports here,
// so this module can be used inside middleware (src/proxy.ts) and auth.config.ts.

export type Role = "SUPERADMIN" | "ADMIN" | "SALES" | "EDITOR" | "CUSTOMER";

export const STAFF_ROLES: Role[] = ["SUPERADMIN", "ADMIN", "SALES", "EDITOR"];

export function isStaff(role?: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role as Role);
}

export function isCustomer(role?: string | null): boolean {
  return role === "CUSTOMER";
}

export const ACTIONS = ["view", "create", "edit", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

// Admin module catalog. `key` drives nav, the permissions matrix, and API guards.
// `href`/`label` drive the sidebar nav.
export const MODULES = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "packages", label: "Packages", href: "/admin/packages" },
  { key: "destinations", label: "Destinations", href: "/admin/destinations" },
  { key: "bookings", label: "Bookings", href: "/admin/bookings" },
  { key: "leads", label: "Leads", href: "/admin/leads" },
  { key: "itinerary", label: "Itineraries", href: "/admin/itinerary" },
  { key: "users", label: "Users", href: "/admin/users" },
  { key: "galleries", label: "Galleries", href: "/admin/galleries" },
  { key: "blogs", label: "Blogs", href: "/admin/blogs" },
  { key: "home", label: "Home Page", href: "/admin/home" },
  { key: "about", label: "About Page", href: "/admin/about" },
  { key: "contact", label: "Contact Page", href: "/admin/contact" },
  { key: "legal", label: "Legal Pages", href: "/admin/legal" },
  { key: "campaigns", label: "Campaigns", href: "/admin/campaigns" },
  { key: "reviews", label: "Reviews", href: "/admin/reviews" },
  { key: "seo", label: "SEO & Pages", href: "/admin/seo" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
  { key: "roles", label: "Roles & Permissions", href: "/admin/roles" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const MODULE_KEYS = MODULES.map((m) => m.key) as ModuleKey[];

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMap = Record<ModuleKey, ModulePermission>;

export const NO_ACCESS: ModulePermission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
};

export const FULL_ACCESS: ModulePermission = {
  view: true,
  create: true,
  edit: true,
  delete: true,
};

/** A permission map where every module is fully allowed (used for SUPERADMIN). */
export function fullPermissionMap(): PermissionMap {
  return MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { ...FULL_ACCESS };
    return acc;
  }, {} as PermissionMap);
}

/** A permission map where every module is denied (default baseline). */
export function emptyPermissionMap(): PermissionMap {
  return MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { ...NO_ACCESS };
    return acc;
  }, {} as PermissionMap);
}
