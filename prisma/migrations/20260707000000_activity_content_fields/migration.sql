-- Additive fields for the Activities module content build-out
ALTER TABLE "Activity"
  ADD COLUMN "whyExperience" TEXT,
  ADD COLUMN "activityHighlights" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "bestTime" TEXT,
  ADD COLUMN "difficulty" TEXT,
  ADD COLUMN "suitableFor" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "pricingGuide" TEXT,
  ADD COLUMN "safetyTips" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "whatToCarry" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "faqs" TEXT NOT NULL DEFAULT '[]';
