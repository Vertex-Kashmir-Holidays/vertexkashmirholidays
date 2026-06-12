import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma, no bcryptjs imports.
// Used in middleware and spread into auth.ts.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminPath = nextUrl.pathname.startsWith("/admin");
      if (!isAdminPath) return true;

      const role = auth?.user?.role;
      if (role === "ADMIN") return true;

      // Logged-in non-admin → home; guest → login
      if (auth?.user) {
        return Response.redirect(new URL("/", nextUrl.origin));
      }
      return false;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "USER";
        token.id = user.id ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.role = (token.role ?? "USER") as string;
        session.user.id = (token.id ?? "") as string;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts
};
