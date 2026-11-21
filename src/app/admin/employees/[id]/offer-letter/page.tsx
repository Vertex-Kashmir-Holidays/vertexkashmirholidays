import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES } from "@/lib/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { todayIst } from "@/lib/trips/board";
import {
  DEPARTMENTS,
  guessDepartment,
  offerLetterDataSchema,
  type OfferLetterInput,
} from "@/lib/offerLetters/schema";
import { OfferLetterClient, type LetterRow } from "@/components/admin/employees/OfferLetterClient";

export const metadata: Metadata = { title: "Offer Letter — Admin" };
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const toYmd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function OfferLetterPage({ params }: Params) {
  const session = await auth();
  if (!(await can(session!.user.role, "employees", "edit"))) {
    return <AccessDenied moduleLabel="offer letters" />;
  }
  const { id } = await params;

  const employee = await prisma.user.findFirst({
    where: { id, deletedAt: null, role: { in: STAFF_ROLES } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      monthlySalary: true,
      bookingConversionPct: true,
      joiningDate: true,
      personalEmail: true,
      address: true,
      offerLetters: {
        orderBy: { createdAt: "desc" },
        select: { id: true, refNo: true, data: true, sentAt: true, sentTo: true, createdAt: true },
      },
    },
  });
  if (!employee) notFound();

  const letters: LetterRow[] = employee.offerLetters.flatMap((l) => {
    const parsed = offerLetterDataSchema.safeParse(l.data);
    if (!parsed.success) return [];
    const { terms: _terms, ...input } = parsed.data;
    return [
      {
        id: l.id,
        refNo: l.refNo,
        input,
        sentAt: l.sentAt?.toISOString() ?? null,
        sentTo: l.sentTo,
        createdAt: l.createdAt.toISOString(),
      },
    ];
  });

  // A new letter starts from the profile.
  const department = guessDepartment(employee.designation, employee.role);
  const fromProfile: OfferLetterInput = {
    title: "Mr",
    fullName: employee.name ?? "",
    guardianName: "",
    address: employee.address ?? "",
    designation: employee.designation ?? "",
    engagementType: /intern/i.test(employee.designation ?? "") ? "INTERNSHIP" : "EMPLOYMENT",
    department,
    reportingOfficer: DEPARTMENTS[department].reportingOfficer,
    monthlyAmount: Math.round(employee.monthlySalary ?? 0),
    commissionPct: employee.bookingConversionPct ?? 0,
    joiningDate: toYmd(employee.joiningDate) || todayIst(),
    letterDate: todayIst(),
    probationMonths: 1,
    noticeMonths: 1,
    duties: [...DEPARTMENTS[department].duties],
    recipientEmail: employee.personalEmail ?? employee.email,
  };

  return (
    <OfferLetterClient
      employee={{ id: employee.id, name: employee.name ?? employee.email }}
      fromProfile={fromProfile}
      letters={letters}
    />
  );
}
