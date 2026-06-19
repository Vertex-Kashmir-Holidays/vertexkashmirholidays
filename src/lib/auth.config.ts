import type { NextAuthConfig } from "next-auth";
import { isStaff, type Role } from "@/lib/rbac";

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const isAdminPath = pathname.startsWith("/admin");
      const isAccountPath = pathname.startsWith("/account");

      // Coarse, edge-safe gating. Fine-grained per-module/action checks happen in
      // server layouts, API routes (requirePermission), and the UI.
      if (!isAdminPath && !isAccountPath) return true;

      const role = auth?.user?.role;

      // Not authenticated → bounce to /login (NextAuth adds callbackUrl).
      if (!auth?.user) return false;

      if (isAdminPath) {
        if (isStaff(role)) return true;
        // Logged-in customer trying to reach the admin panel → send to their area.
        return Response.redirect(new URL("/account", nextUrl.origin));
      }

      // isAccountPath: any authenticated user may access their account area, but a
      // customer holding a system-issued temp password must set a new one first.
      // Coarse edge gate — the server page + API also enforce this authoritatively.
      if (auth.user.mustChangePassword && pathname !== "/account/change-password") {
        return Response.redirect(new URL("/account/change-password", nextUrl.origin));
      }
      return true;
    },

    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword ?? false;
      }

      // After the customer sets a new password the client calls update() so the
      // JWT (and thus the middleware gate) immediately reflects the cleared flag.
      if (
        trigger === "update" &&
        session &&
        typeof session === "object" &&
        "mustChangePassword" in session
      ) {
        token.mustChangePassword = Boolean(
          (session as { mustChangePassword?: unknown }).mustChangePassword,
        );
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    }
  },

  providers: [],
} satisfies NextAuthConfig;