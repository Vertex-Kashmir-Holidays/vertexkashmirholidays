'use client';

import { motion, type Variants } from 'framer-motion';
import { Compass, ShieldCheck, BedDouble, CarFront, Headphones, PenLine } from 'lucide-react';

const WHY_CHOOSE_ITEMS = [
  { t: 'Local Kashmir Experts', s: 'Planned by a team based in Kashmir, not a call centre', Icon: Compass },
  { t: 'Transparent Pricing', s: 'No hidden charges — the price you see is the price you pay', Icon: ShieldCheck },
  { t: 'Handpicked Hotels', s: 'Every property personally inspected before it goes on a package', Icon: BedDouble },
  { t: 'Private Transportation', s: 'Your own vehicle and driver for the whole trip', Icon: CarFront },
  { t: '24×7 Support', s: "On-ground help whenever you need it, day or night", Icon: Headphones },
  { t: 'Customized Itineraries', s: 'Every package can be adjusted to fit how you want to travel', Icon: PenLine },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// Static trust section for the /tours/category hub — same visual language as
// ToursTrustBar (icon chip + title + subtitle) but six items instead of four,
// since there's no CMS-managed content backing this page.
export function TourCategoryHubWhyChoose() {
  return (
    <section>
      <h2 className="h-display text-[22px] font-bold text-foreground sm:text-[26px]">Why Choose Vertex</h2>
      <motion.div
        className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {WHY_CHOOSE_ITEMS.map((x, i) => (
          <motion.div key={i} variants={itemVariants} className="flex items-start gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-primary shadow-soft">
              <x.Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[14px] font-bold text-foreground">{x.t}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{x.s}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
