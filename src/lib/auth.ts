import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/security/turnstile";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // Optional Turnstile token (verified only when TURNSTILE_SECRET_KEY is set).
  turnstileToken: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        // ── Brute-force throttle + CAPTCHA ──────────────────────────────────
        // All failures below return a generic null (NextAuth surfaces a single
        // "CredentialsSignin") so we never reveal whether the email exists.
        const ip = request ? clientIp(request) : "unknown";
        const email = parsed.data.email.toLowerCase();

        // Backoff: cap attempts per IP and per account within a window. A locked
        // window naturally clears, so this is backoff rather than a hard lock.
        const ipOk = await rateLimit(`login:ip:${ip}`, 20, "10 m");
        const acctOk = await rateLimit(`login:acct:${email}`, 10, "15 m");
        if (!ipOk.success || !acctOk.success) {
          return null;
        }

        // CAPTCHA (enforced only when TURNSTILE_SECRET_KEY is configured).
        const captchaOk = await verifyTurnstile(parsed.data.turnstileToken, ip);
        if (!captchaOk) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          return null;
        }

        // Soft-deleted accounts cannot sign in.
        if (user.deletedAt) {
          return null;
        }

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});