// src/components/about/AboutCertifications.tsx
'use client';

import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import type { CertificationData, LicensesData } from '@/types/about';

interface AboutCertificationsProps {
  licenses: LicensesData;
  certifications: CertificationData[];
}

// Mirrors AboutValues.tsx's section/card structure exactly (same wrapper
// classes, same motion pattern) — the primary license card uses real
// SiteSettings data (never duplicated into the Certification list model
// below, which exists only for additional future-ready credentials).
export function AboutCertifications({ licenses, certifications }: AboutCertificationsProps) {
  if (!licenses.registrationNumber) return null;

  return (
    <section className="mx-auto mt-14 max-w-[1300px] px-6">
      <motion.div
        className="rounded-2xl bg-muted p-7 lg:p-9"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
          <div>
            <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">TRUST &amp; LICENSING</p>
            <h2 className="h-display mt-3 font-display text-[17px] font-bold leading-snug">Licensed &amp; Certified</h2>
            <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
              Real credentials you can verify — not just a claim.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-card p-5 text-center shadow-soft sm:col-span-2 lg:col-span-2">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <BadgeCheck className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <p className="mt-4 text-[14px] font-bold">J&amp;K Tourism Registration</p>
              {licenses.businessName && (
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{licenses.businessName}</p>
              )}
              <p className="mt-1 text-[13px] font-bold text-primary">{licenses.registrationNumber}</p>
              {licenses.authority && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Issued by {licenses.authority}</p>
              )}
            </div>
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.id}
                className="rounded-xl bg-card p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={cert.icon} />
                  </svg>
                </span>
                <p className="mt-4 text-[14px] font-bold">{cert.title}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{cert.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
