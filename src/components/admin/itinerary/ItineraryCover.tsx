"use client";

import { EditableField } from "./EditableField";
import { ImagePicker } from "./ImagePicker";
import { ItineraryIcon } from "./icons";
import type { ItineraryData } from "@/types/itinerary";

type CoverField =
  | "coverTitle" | "subtitle" | "duration" | "preparedFor"
  | "travelDates" | "travelers" | "packageType" | "totalCost";

interface ItineraryCoverProps {
  data: Pick<ItineraryData, CoverField | "coverImage">;
  onUpdate: (field: CoverField, value: string) => void;
  onImageChange: (src: string) => void;
}

export function ItineraryCover({ data, onUpdate, onImageChange }: ItineraryCoverProps) {
  return (
    <article className="page cover relative min-h-[1160px] overflow-hidden rounded-xl bg-gradient-to-br from-[#0f261b] via-[#1a3a2a] to-[#0f261b]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,rgba(12,28,22,.45) 0%,rgba(12,28,22,.18) 32%,rgba(10,24,18,.55) 70%,rgba(8,20,15,.85) 100%)",
        }}
      />

      <ImagePicker value={data.coverImage} onChange={onImageChange} className="absolute right-4 top-4 z-20" label="Cover image" />

      <div className="relative flex min-h-[1160px] flex-col p-12 text-white">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/icon.png"
            alt="Vertex Kashmir Holidays"
            className="h-11 w-11 rounded-md bg-white object-contain p-1"
          />
          <span className="leading-tight">
            <span className="block font-serif text-2xl font-bold">Vertex</span>
            <span className="block text-[10px] font-semibold tracking-[0.18em] text-white/85">Kashmir Holidays</span>
          </span>
        </div>

        <div className="mt-24">
          <EditableField
            value={data.coverTitle}
            onValueChange={(v) => onUpdate("coverTitle", v)}
            className="font-serif text-[78px] font-semibold leading-[0.95] tracking-[0.06em] text-white"
          />
          <EditableField
            value={data.subtitle}
            onValueChange={(v) => onUpdate("subtitle", v)}
            className="-mt-3 font-script text-[58px] leading-none text-[hsl(146_35%_55%)]"
          />
          <div className="mt-6 flex items-center gap-4">
            <span className="h-px w-12 bg-white/60" />
            <EditableField
              value={data.duration}
              onValueChange={(v) => onUpdate("duration", v)}
              className="font-serif max-w-[260px] text-sm font-semibold tracking-[0.3em] text-white"
            />
            <span className="text-white/60">✦</span>
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-center text-[11px] font-semibold tracking-[0.32em] text-white/70">PREPARED FOR</p>
          <EditableField
            value={data.preparedFor}
            onValueChange={(v) => onUpdate("preparedFor", v)}
            className="font-serif mt-1.5 text-center text-4xl font-semibold text-white"
          />

          <div className="mt-9 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
            <div className="flex items-start gap-3">
              <ItineraryIcon icon="calendar" className="mt-0.5 h-6 w-6 shrink-0 text-[hsl(146_35%_55%)]" />
              <div className="min-w-0">
                <EditableField value={data.travelDates} onValueChange={(v) => onUpdate("travelDates", v)} className="text-sm font-bold text-white" />
                <p className="text-[10px] tracking-wide text-white/65">TRAVEL DATES</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ItineraryIcon icon="support" className="mt-0.5 h-6 w-6 shrink-0 text-[hsl(146_35%_55%)]" />
              <div className="min-w-0">
                <EditableField value={data.travelers} onValueChange={(v) => onUpdate("travelers", v)} className="text-sm font-bold text-white" />
                <p className="text-[10px] tracking-wide text-white/65">TRAVELLERS</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ItineraryIcon icon="star" className="mt-0.5 h-6 w-6 shrink-0 text-[hsl(146_35%_55%)]" />
              <div className="min-w-0">
                <EditableField value={data.packageType} onValueChange={(v) => onUpdate("packageType", v)} className="text-sm font-bold text-white" />
                <p className="text-[10px] tracking-wide text-white/65">PACKAGE TYPE</p>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-xl bg-[hsl(158_46%_14%)]/85 py-5 text-center ring-1 ring-white/10 backdrop-blur">
            <EditableField value={data.totalCost} onValueChange={(v) => onUpdate("totalCost", v)} className="font-serif text-center text-3xl font-bold text-white" />
            <p className="text-[11px] font-semibold tracking-[0.28em] text-white/70">TOTAL PACKAGE COST</p>
          </div>
        </div>
      </div>
    </article>
  );
}
