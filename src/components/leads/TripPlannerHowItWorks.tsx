import { MessageCircle, Search, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    Icon: MessageCircle,
    title: "Tell us what you need",
    body: "Transport, a Kashmir tour, a hotel — or all of it. No package required.",
  },
  {
    Icon: Search,
    title: "Our team checks options",
    body: "We check real fares and availability with our travel partners and prepare your quote.",
  },
  {
    Icon: CheckCircle2,
    title: "You choose what works",
    body: "Review the options on WhatsApp and pick exactly what you want — nothing more.",
  },
] as const;

// Deliberately human-assisted framing throughout — never implies instant or
// live pricing (there is no live fare API behind this page).
export function TripPlannerHowItWorks() {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="text-center">
        <p className="text-[12px] font-bold tracking-[0.22em] text-primary">HOW IT WORKS</p>
        <h2 className="h-display mt-3 text-[18px] font-bold text-foreground">
          A real person plans this with you
        </h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {STEPS.map(({ Icon, title, body }, i) => (
          <div key={title} className="glass relative rounded-3xl p-6 text-center shadow-card">
            <span className="glass-strong mx-auto grid h-12 w-12 place-items-center rounded-2xl text-foreground shadow-card">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-[12px] font-bold tracking-wide text-primary">STEP {i + 1}</p>
            <p className="mt-1 text-[15px] font-bold text-foreground">{title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
