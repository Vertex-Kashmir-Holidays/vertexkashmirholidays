// Web push to the devices a user turned notifications on for (see
// PushSubscription in prisma/schema.prisma and public/sw.js). Best-effort like
// the bell: never throws, and does nothing until the VAPID keys are set.
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export interface PushMessage {
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped. */
  link?: string | null;
}

let configured: boolean | null = null;

/** Public key the browser subscribes with (also exposed as NEXT_PUBLIC_VAPID_PUBLIC_KEY). */
export const vapidPublicKey = () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = vapidPublicKey();
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@vertexkashmirholidays.com", pub, priv);
  return (configured = true);
}

/** Push one message to every device of these users. Never throws. */
export async function sendPushToUsers(userIds: string[], msg: PushMessage): Promise<void> {
  try {
    if (userIds.length === 0 || !ensureConfigured()) return;
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: [...new Set(userIds)] } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });
    const payload = JSON.stringify({ title: msg.title, body: msg.body, link: msg.link ?? "/" });
    const gone: string[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 },
          );
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode;
          // The browser dropped this subscription (uninstalled, permission revoked…).
          if (code === 404 || code === 410) gone.push(s.id);
          else console.error("[push] send failed", code ?? err);
        }
      }),
    );
    if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  } catch (err) {
    console.error("[push] sendPushToUsers failed", err);
  }
}
