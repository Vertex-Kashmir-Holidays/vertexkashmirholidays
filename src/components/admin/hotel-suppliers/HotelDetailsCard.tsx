// Hotel details card — room rates, location/contact and services, tinted by
// data completeness (see the colour rules below). Shown on the hotel's own
// page (/admin/hotel-suppliers/[id]).
//
// Colour signals a data-completeness state at a glance:
//   - red  — missing email or missing a rate: staff shouldn't be steering a
//     customer toward this hotel yet, since there's nothing to quote or no
//     way to chase a rate. Takes priority even if also marked recommended —
//     an incomplete "recommended" hotel is the more urgent thing to notice.
//   - green — recommended AND has both an email and a rate on file: a safe
//     default pick.
//   - neutral — everything else (has the basics, just not flagged either way).
import { MapPin, User, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMinMapRate, parseServices, type HotelData } from "@/lib/hotelSuppliers/schema";

function fmtMoney(n: number | null): string {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN")}`;
}

function fmtDate(ymd: string): string {
  const d = new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ymd
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function HotelDetailsCard({
  data,
  recommended,
  className,
  children,
}: {
  data: HotelData;
  recommended: boolean;
  className?: string;
  /** Extra sections rendered inside the card, below the details grid. */
  children?: React.ReactNode;
}) {
  const rooms = data.rate?.rooms ?? [];
  const services = parseServices(data.property.services);
  const hasEmail = !!data.property.email;
  const hasRate = getMinMapRate(data.rate) != null;
  const incomplete = !hasEmail || !hasRate;
  const status: "red" | "green" | "neutral" = incomplete
    ? "red"
    : recommended
      ? "green"
      : "neutral";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        className,
        status === "green" && "border-emerald-500/25 bg-emerald-500/[0.06]",
        status === "red" && "border-red-500/25 bg-red-500/[0.06]",
        status === "neutral" && "border-border bg-muted/40",
      )}
    >
      {status !== "neutral" && (
        <p
          className={cn(
            "mb-3 text-[11px] font-bold uppercase tracking-wide",
            status === "green" && "text-emerald-600 dark:text-emerald-400",
            status === "red" && "text-red-600 dark:text-red-400",
          )}
        >
          {status === "green"
            ? "Recommended · rate on file"
            : "Incomplete — add an email and/or rate before recommending"}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="rounded-xl border border-border/60 bg-card p-3.5">
          <p className="mb-2 flex items-baseline justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Room Rates
            {data.rate?.validTo && (
              <span className="normal-case tracking-normal font-semibold">
                Valid till {fmtDate(data.rate.validTo)}
              </span>
            )}
          </p>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">No rate on file.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="font-semibold pb-1.5 pr-2">Room Type</th>
                  <th className="font-semibold pb-1.5 pr-2 text-right">EP</th>
                  <th className="font-semibold pb-1.5 pr-2 text-right">CP</th>
                  <th className="font-semibold pb-1.5 text-right">MAP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rooms.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-2 font-medium text-foreground">{r.roomType}</td>
                    <td className="py-1.5 pr-2 text-right text-foreground/80">{fmtMoney(r.ep)}</td>
                    <td className="py-1.5 pr-2 text-right text-foreground/80">{fmtMoney(r.cp)}</td>
                    <td className="py-1.5 text-right text-foreground/80">{fmtMoney(r.map)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
              <MapPin className="w-3 h-3" /> Location
            </p>
            <p className="text-sm text-foreground/85">{data.property.location || "—"}</p>
          </div>
          <div className="border-t border-border/60 pt-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
              <User className="w-3 h-3" /> Contact Person
            </p>
            <p className="text-sm text-foreground/85">{data.property.contactPerson || "—"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
            <ListChecks className="w-3 h-3" /> Services
          </p>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">—</p>
          ) : (
            <ul className="space-y-1 text-sm text-foreground/80">
              {services.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary shrink-0">•</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
