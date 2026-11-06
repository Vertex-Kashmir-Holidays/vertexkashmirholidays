"use client";

import { useRouter } from "next/navigation";

/** Table row that opens a booking on click (the guest-name link inside stays keyboard-accessible). */
export function StayRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr onClick={() => router.push(href)} className="cursor-pointer hover:bg-muted/40">
      {children}
    </tr>
  );
}
