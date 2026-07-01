import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ meetingId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;

  const userId = guard.user.id;
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, roomId: true, status: true, jitsiRoomId: true },
  });
  if (!meeting || meeting.status !== "ACTIVE") {
    return NextResponse.json({ error: "Meeting not found or ended" }, { status: 404 });
  }

  if (meeting.roomId) {
    const member = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: meeting.roomId, userId } },
    });
    if (!member || member.leftAt) {
      return NextResponse.json({ error: "Not a room member" }, { status: 403 });
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  const rawPrivateKey = process.env.JAAS_PRIVATE_KEY;

  if (!appId || !keyId || !rawPrivateKey) {
    return NextResponse.json({ error: "JaaS not configured" }, { status: 500 });
  }

  const pemKey = rawPrivateKey.replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(pemKey, "RS256");

  const isModerator = ["SUPERADMIN", "ADMIN", "SALES"].includes(user.role);
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    aud: "jitsi",
    iss: "chat",
    sub: appId,
    room: "*",
    context: {
      user: {
        id: user.id,
        name: user.name ?? "User",
        email: user.email ?? "",
        avatar: user.image ?? "",
        "hidden-from-recorder": false,
        moderator: isModerator,
      },
      features: {
        livestreaming: false,
        "file-upload": false,
        "outbound-call": false,
        "sip-outbound-call": false,
        transcription: false,
        "list-visitors": false,
        recording: false,
        flip: false,
      },
    },
  })
    .setProtectedHeader({ alg: "RS256", kid: `${appId}/${keyId}`, typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setNotBefore(now - 10)
    .sign(privateKey);

  return NextResponse.json({ jwt, appId, jitsiRoomId: meeting.jitsiRoomId });
}
