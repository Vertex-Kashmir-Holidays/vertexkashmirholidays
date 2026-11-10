"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_LOGO_BYTES = 500 * 1024; // 500KB
const ACCEPTED_TYPES = ["image/png", "image/webp"];
// Longest side a converted WebP logo is drawn at — plenty for the PDF/admin
// thumbnails, and keeps the converted PNG under the 500KB server limit.
const MAX_CONVERTED_SIDE = 800;

/**
 * WebP → PNG data URL via canvas. Agency logos end up in the B2B itinerary
 * PDF (@react-pdf/renderer), which only renders PNG/JPEG — so WebP is
 * accepted at the picker but always stored as PNG. Only ever scales down.
 */
function webpToPngDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_CONVERTED_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

/** Decoded byte size of a base64 data URL. */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4);
}

interface Props {
  /** Fires with the validated data URL, or undefined once cleared/invalid. */
  onChange: (dataUrl: string | undefined) => void;
  /** Shown alongside the field's own validation errors (e.g. "required" from the parent form). */
  externalError?: string | null;
}

/**
 * PNG/WebP company logo picker, capped at 500KB (no pixel-dimension check) —
 * shared by the public B2B registration form and the CRM manual-creation
 * form so the two never validate a logo differently. The server
 * (parseAgencyLogo in src/lib/b2b/schema.ts) re-validates format/size
 * independently before ever storing it — this is client-side UX only.
 * WebP is converted to PNG here, so the server and PDF only ever see PNG.
 */
export function LogoUploadField({ onChange, externalError }: Props) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resets the file/preview state only — does NOT touch logoError, since
  // every rejection branch below sets an error message immediately before
  // calling this, and that message must survive the reset.
  function resetFile() {
    setLogoDataUrl(undefined);
    setLogoFileName(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(undefined);
  }

  function clear() {
    resetFile();
    setLogoError(null);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Logo must be a PNG or WebP image.");
      resetFile();
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(`Logo must be under 500KB (this file is ${(file.size / 1024).toFixed(0)}KB).`);
      resetFile();
      return;
    }

    if (file.type === "image/webp") {
      webpToPngDataUrl(file)
        .then((dataUrl) => {
          if (dataUrlBytes(dataUrl) > MAX_LOGO_BYTES) {
            setLogoError("This logo is too large once converted. Please upload a smaller image.");
            resetFile();
            return;
          }
          setLogoDataUrl(dataUrl);
          setLogoFileName(file.name);
          setLogoError(null);
          onChange(dataUrl);
        })
        .catch(() => {
          setLogoError("Couldn't read this file. Please try again.");
          resetFile();
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoDataUrl(dataUrl);
      setLogoFileName(file.name);
      setLogoError(null);
      onChange(dataUrl);
    };
    reader.onerror = () => {
      setLogoError("Couldn't read this file. Please try again.");
      resetFile();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label htmlFor="b2bLogo" className="text-[14px] font-semibold">
        Company Logo <span className="text-rose-500">*</span>{" "}
        <span className="font-medium text-muted-foreground">(PNG or WebP, under 500KB)</span>
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <label
          htmlFor="b2bLogo"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-[13px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <ImagePlus className="h-4 w-4" strokeWidth={1.9} />
          {logoFileName ? "Change file" : "Choose PNG or WebP file"}
        </label>
        <input
          ref={inputRef}
          id="b2bLogo"
          type="file"
          accept="image/png,image/webp"
          onChange={handleChange}
          className="sr-only"
        />
        {logoDataUrl && (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small (<=500KB) client-side data URI, not a remote asset next/image can optimize */}
            <img
              src={logoDataUrl}
              alt="Logo preview"
              className="h-9 w-9 rounded border border-border object-contain"
            />
            <span className="max-w-[10rem] truncate text-[12px] text-muted-foreground">
              {logoFileName}
            </span>
            <button
              type="button"
              onClick={clear}
              aria-label="Remove logo"
              className="text-muted-foreground hover:text-rose-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {(logoError || externalError) && (
        <p className="mt-1 text-[12px] text-rose-500">{logoError ?? externalError}</p>
      )}
    </div>
  );
}
