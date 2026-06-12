import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use only the edge-safe authConfig — no Prisma or bcryptjs.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};
