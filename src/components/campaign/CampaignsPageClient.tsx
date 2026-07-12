'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AffordabilityWidget } from '@/components/payments/AffordabilityWidget';
import { CampaignCard } from '@/components/campaign/CampaignCard';
import type { CampaignListItemData } from '@/types/campaign';

interface CampaignsPageClientProps {
  campaigns: CampaignListItemData[];
}

const PAGE_SIZE = 9;

export function CampaignsPageClient({ campaigns }: CampaignsPageClientProps) {
  const [page, setPage] = useState(1);

  // Lowest campaign price anchors the EMI estimate, matching the tours page.
  const emiAmount = useMemo(() => {
    const prices = campaigns
      .map((c) => c.priceFrom)
      .filter((p): p is number => p != null && p > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [campaigns]);

  const pageCount = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = campaigns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="mx-auto max-w-[1300px] px-5 py-10 sm:px-6">
      {/* EMI options — always at the top, no filters on this page. */}
      {emiAmount > 0 && (
        <div className="mb-10">
          <AffordabilityWidget amount={emiAmount} title="Easy EMI Available on Campaigns" />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="h-display text-[26px] font-bold">
          All Campaigns{' '}
          <span className="font-sans text-[14px] font-semibold text-primary">
            ({campaigns.length} {campaigns.length === 1 ? 'Campaign' : 'Campaigns'})
          </span>
        </h2>
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-[18px] font-bold">No campaigns available right now</p>
          <p className="text-[14px] text-muted-foreground">
            Please check back soon — new seasonal experiences are added regularly.
          </p>
        </div>
      ) : (
        <motion.div
          key={currentPage}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
        >
          {paged.map((campaign, i) => (
            <CampaignCard key={campaign.id} campaign={campaign} index={i} />
          ))}
        </motion.div>
      )}

      {pageCount > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          <motion.button
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </motion.button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <motion.button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={`${
                p === currentPage
                  ? 'bg-primary text-primary-foreground shadow-card'
                  : 'border border-border bg-card text-foreground shadow-soft hover:border-primary hover:text-primary'
              } grid h-10 w-10 place-items-center rounded-full text-[14px] font-semibold transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {p}
            </motion.button>
          ))}
          <motion.button
            aria-label="Next page"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
          </motion.button>
        </nav>
      )}
    </main>
  );
}
