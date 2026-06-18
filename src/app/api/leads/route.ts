import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, leadNotificationHtml, leadNotificationText } from "@/lib/mail";
import { requirePermission } from "@/lib/permissions";
import { LeadSource } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Map arbitrary source strings from public forms to the LeadSource enum.
function resolveSource(raw?: string): LeadSource {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("google")) return LeadSource.GOOGLE_ADS;
  if (s.includes("meta") || s.includes("facebook") || s.includes("instagram")) return LeadSource.META_ADS;
  if (s === "referral") return LeadSource.REFERRAL;
  if (s === "manual") return LeadSource.MANUAL;
  return LeadSource.WEBSITE;
}

// Admin: list leads with pagination, optional filters, and role-scoped access.
export async function GET(req: NextRequest) {
  const guard = await requirePermission("leads", "view");
  if (guard instanceof NextResponse) return guard;

  const role = (guard.user as { role: string }).role;
  const userId = guard.user.id as string;
  const isAdminOrSuper = role === "SUPERADMIN" || role === "ADMIN";

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();
  const source = searchParams.get("source")?.trim();
  const assignedToId = searchParams.get("assignedToId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = 30;
  const skip = (page - 1) * take;

  const where: Prisma.LeadWhereInput = {};
  // Non-admin users can only see their assigned leads — enforced server-side.
  if (!isAdminOrSuper) {
    where.assignedToId = userId;
  }
  if (status && status !== "ALL") where.status = status as Prisma.LeadWhereInput["status"];
  if (source && source !== "ALL") where.source = source as Prisma.LeadWhereInput["source"];
  if (isAdminOrSuper && assignedToId && assignedToId !== "ALL") {
    where.assignedToId = assignedToId;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        category: true,
        adults: true,
        status: true,
        startDate: true,
        followUpAt: true,
        updatedAt: true,
        negotiatedAmount: true,
        tokenAmount: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdAt: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, pages: Math.ceil(total / take) });
}

const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  travelDate: z.string().optional(),
  travellers: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

// Public: create a lead from any inquiry/contact form.
// No auth guard — called from hero, tour sidebar, contact page, and campaign pages.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.data ?? parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { travelDate, travellers, email, message, source, ...rest } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...rest,
      email: email || undefined,
      source: resolveSource(source),
      adults: travellers ?? 1,
      startDate: travelDate ? new Date(travelDate) : undefined,
      notes: message || undefined,
    },
  });

  const adminTo =
    process.env.MAIL_TO_ADMIN ??
    process.env.MAIL_FROM ??
    "admin@vertexkashmirholidays.com";

  await sendMail({
    to: adminTo,
    subject: `New lead from ${lead.name} (${lead.phone})`,
    html: leadNotificationHtml({
      name: lead.name,
      phone: lead.phone,
      email: lead.email ?? undefined,
      travelDate,
      travellers,
      message: message || undefined,
      source,
    }),
    text: leadNotificationText({
      name: lead.name,
      phone: lead.phone,
      email: lead.email ?? undefined,
      travelDate,
      travellers,
      message: message || undefined,
      source,
    }),
    replyTo: lead.email ?? undefined,
  });

  return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
}
