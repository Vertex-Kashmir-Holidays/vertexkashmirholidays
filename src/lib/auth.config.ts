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

      // isAccountPath: any authenticated user may access their account area.
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
      }

      return session;
    }
  },

  providers: [],
} satisfies NextAuthConfig;