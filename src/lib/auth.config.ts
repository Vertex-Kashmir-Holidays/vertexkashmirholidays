import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminPath = nextUrl.pathname.startsWith("/admin");

      if (!isAdminPath) return true;

      if (auth?.user?.role === "ADMIN") {
        return true;
      }

      if (auth?.user) {
        return Response.redirect(new URL("/", nextUrl.origin));
      }

      return false;
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
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }

      return session;
    }
  },

  providers: [],
} satisfies NextAuthConfig;