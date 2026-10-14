// src/components/adventure/AdventurePricing.tsx
"use client";

import { adventureStartingPrice } from "@/lib/adventureTiers";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Tilt3D } from "@/components/ui/effects/3DTilt";
import Link from "next/link";
import { AffordabilityWidget } from "@/components/payments/AffordabilityWidget";
import { adventureTierChoices } from "@/lib/adventureTiers";
import type { AdventureTier } from "@/types/adventure";

interface AdventurePricingProps {
  tiers: AdventureTier[];
  kicker: string | null;
  title: string | null;
  paymentNote: string | null;
  /** A "Choose" button was clicked — the tier name the lead form will send. */
  onChoose: (tierName: string) => void;
}

export function AdventurePricing({
  tiers,
  kicker,
  title,
  paymentNote,
  onChoose,
}: AdventurePricingProps) {
  // The adventure's starting price (per person, 2-sharing) → EMI widget.
  const emiAmount = adventureStartingPrice(tiers).price ?? 0;

  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20" id="pricing">
      <div className="text-center">
        <motion.p
          className="text-[12px] font-extrabold tracking-[0.24em] text-adventure-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {kicker || "SIMPLE PRICING"}
        </motion.p>
        <motion.h2
          className="h-display mt-3 text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {title || "Pick how you want to travel"}
        </motion.h2>
        <motion.p
          className="mt-3 text-[14px] text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {paymentNote || "Lock your seat with just 10% advance · Balance 7 days before departure"}
        </motion.p>
      </div>
      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        {tiers.map((tier, i) => {
          const popular = tier.tag === "MOST POPULAR";
          const choices = adventureTierChoices(tier);
          const twoPrices = choices.length > 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Tilt3D intensity={6}>
                <div
                  className={`relative flex flex-col rounded-3xl p-7 ${popular ? "glass-strong shadow-glow" : "glass shadow-card"}`}
                  style={popular ? { border: "1.5px solid var(--adventure-accent)" } : {}}
                >
                  <div className="flex h-full flex-col">
                    {tier.tag && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-grad px-4 py-1.5 text-[12px] font-extrabold tracking-wide text-white ring-inner">
                        {tier.tag}
                      </span>
                    )}
                    <h3 className="text-[18px] font-bold text-foreground">{tier.name}</h3>
                    <p className="mt-1 text-[14px] text-muted-foreground">{tier.desc}</p>
                    {twoPrices ? (
                      <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
                        {choices.map((choice) => (
                          <div
                            key={choice.name}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                                {choice.label}
                              </p>
                              <p className="flex flex-wrap items-baseline gap-x-2">
                                <span className="text-[22px] font-extrabold text-foreground">
                                  {choice.price}
                                </span>
                                {choice.old && (
                                  <span className="text-[12px] text-muted-foreground line-through">
                                    {choice.old}
                                  </span>
                                )}
                                <span className="text-[12px] text-muted-foreground">/person</span>
                              </p>
                            </div>
                            <Link
                              href="#reserve"
                              onClick={() => onChoose(choice.name)}
                              aria-label={`Choose ${choice.name}`}
                              className={`${
                                popular
                                  ? "sweep bg-accent-grad text-white ring-inner shadow-glow"
                                  : "glass text-foreground hover:bg-foreground/10"
                              } shrink-0 rounded-xl px-4 py-2.5 text-[14px] font-extrabold transition hover:scale-[1.02]`}
                            >
                              Choose
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 flex items-baseline gap-2">
                        <span className="text-[30px] font-extrabold text-foreground">
                          {tier.price}
                        </span>
                        {tier.old && (
                          <span className="text-[14px] text-muted-foreground line-through">
                            {tier.old}
                          </span>
                        )}
                        <span className="text-[12px] text-muted-foreground">/person</span>
                      </p>
                    )}
                    <ul className="mt-5 flex-1 space-y-2.5 text-[14px] text-foreground/75">
                      {tier.feats.map((feat, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-green-glow"
                            strokeWidth={2.5}
                          />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    {!twoPrices && (
                      <Link
                        href="#reserve"
                        onClick={() => onChoose(tier.name)}
                        className={`${
                          popular
                            ? "sweep bg-accent-grad text-white ring-inner shadow-glow"
                            : "glass text-foreground hover:bg-foreground/10"
                        } mt-7 rounded-xl py-3 text-center text-[14px] font-extrabold transition hover:scale-[1.02]`}
                      >
                        Choose {tier.name}
                      </Link>
                    )}
                  </div>
                </div>
              </Tilt3D>
            </motion.div>
          );
        })}
      </div>

      {emiAmount > 0 && (
        <AffordabilityWidget
          amount={emiAmount}
          title="Easy EMI Available"
          className="mx-auto mt-10 max-w-xl"
        />
      )}
    </section>
  );
}
