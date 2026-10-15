"use client";

import { useCallback, useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/brand";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import { QualificationFields } from "@/components/leads/QualificationFields";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { qualifyWhatsAppAttribution, readWhatsAppAttributionTag } from "@/lib/attribution";
import { trackWhatsappOpen } from "@/lib/analytics";
import {
  bandForPrice,
  budgetText,
  initialQualification,
  qualificationLines,
  readContext,
  withQualificationLines,
  writeSessionQualification,
  type Qualification,
  type QualificationContext,
} from "@/lib/leads/qualification";
import { isWhatsAppHref, setWhatsAppGateHandler } from "@/lib/leads/whatsappGate";

// Every WhatsApp CTA on the public site opens this modal first, and asks by
// context (the nearest data-wa-context around the clicked link):
//   generic  — budget per person + travel month
//   tour     — travel month only; the budget band is derived from the tour's
//              price (stored with budgetDerived) and shown read-only
//   activity — travel month only, no budget
//   offer    — both, pre-filled from the chosen tier and the trip date
// The answers are appended to the CTA's own prefilled message, before its Ref
// tag, and saved onto the visitor's attribution token; "Open WhatsApp" also
// stamps the token as opened, so an abandoned modal never looks like a lead.
// Chosen (not derived) answers are remembered for the session.
export function WhatsAppQualificationGate() {
  const { budgetBands } = useSiteSettings();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [context, setContext] = useState<QualificationContext>({ kind: "generic" });
  const [answers, setAnswers] = useState<Partial<Qualification>>({});

  // A tour's price-derived band (null when the price fits no band — then the
  // budget is asked as on a generic page).
  const derivedBand =
    context.kind === "tour" ? (bandForPrice(budgetBands, context.pricePerPerson) ?? null) : null;
  const asksBudget = context.kind !== "activity" && !derivedBand;

  const resolve = useCallback(
    (ctx: QualificationContext, picked: Partial<Qualification>) => {
      const band = ctx.kind === "tour" ? bandForPrice(budgetBands, ctx.pricePerPerson) : undefined;
      const budgetBandKey = band
        ? band.key
        : ctx.kind === "activity"
          ? undefined
          : picked.budgetBandKey;
      return { budgetBandKey, travelMonth: picked.travelMonth, budgetDerived: !!band };
    },
    [budgetBands],
  );

  const save = useCallback(
    (ctx: QualificationContext, picked: Partial<Qualification>, opened: boolean) => {
      const r = resolve(ctx, picked);
      const needsBudget = ctx.kind !== "activity";
      if (!r.travelMonth || (needsBudget && !r.budgetBandKey)) return null;
      qualifyWhatsAppAttribution(
        {
          budgetBandKey: r.budgetBandKey,
          travelMonth: r.travelMonth,
          budgetDerived: r.budgetDerived,
        },
        opened,
      );
      return r;
    },
    [resolve],
  );

  const open = useCallback(
    (href: string, ctx: QualificationContext) => {
      const start = initialQualification();
      setContext(ctx);
      setAnswers(start);
      setPendingHref(href);
      // Pre-selected answers (session / offer page / tour price) are saved straight away.
      save(ctx, start, false);
    },
    [save],
  );

  useEffect(() => {
    // Capture phase, so this runs before any link navigates; the link's own
    // onClick (e.g. its whatsapp_click tracking) still fires as before.
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || !isWhatsAppHref(link.href)) return;
      e.preventDefault();
      open(link.href, readContext(link));
    }
    document.addEventListener("click", onClick, true);
    // Non-link opens (e.g. a toast action) have no element — generic.
    setWhatsAppGateHandler((href) => open(href, { kind: "generic" }));
    return () => {
      document.removeEventListener("click", onClick, true);
      setWhatsAppGateHandler(null);
    };
  }, [open]);

  function change(next: Partial<Qualification>) {
    setAnswers(next);
    // Remember only what the visitor actually chose.
    writeSessionQualification(asksBudget ? next : { travelMonth: next.travelMonth });
    save(context, next, false);
  }

  const resolved = resolve(context, answers);
  const complete =
    !!resolved.travelMonth && (context.kind === "activity" || !!resolved.budgetBandKey);

  function openWhatsApp() {
    if (!pendingHref || !complete || !resolved.travelMonth) return;
    const url = withQualificationLines(
      pendingHref,
      qualificationLines(
        budgetBands,
        { budgetBandKey: resolved.budgetBandKey, travelMonth: resolved.travelMonth },
        new Date(),
        context.kind === "tour" && resolved.budgetDerived ? context.name : undefined,
      ),
      readWhatsAppAttributionTag(),
    );
    save(context, answers, true);
    trackWhatsappOpen(resolved.budgetBandKey, resolved.travelMonth, resolved.budgetDerived);
    window.open(url, "_blank", "noopener,noreferrer");
    setPendingHref(null);
  }

  return (
    <Dialog open={pendingHref !== null} onOpenChange={(o) => !o && setPendingHref(null)}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px]">Before we chat on WhatsApp</DialogTitle>
          <DialogDescription>
            {asksBudget
              ? "Two quick answers help us send the right options straight away."
              : "One quick answer helps us send the right options straight away."}
          </DialogDescription>
        </DialogHeader>
        <QualificationFields
          value={answers}
          onChange={change}
          showBudget={asksBudget}
          derivedBudget={
            derivedBand && context.kind === "tour"
              ? `${budgetText(budgetBands, derivedBand.key)} (${context.name})`
              : undefined
          }
        />
        <button
          type="button"
          onClick={openWhatsApp}
          disabled={!complete}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-[15px] font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Open WhatsApp
        </button>
      </DialogContent>
    </Dialog>
  );
}
