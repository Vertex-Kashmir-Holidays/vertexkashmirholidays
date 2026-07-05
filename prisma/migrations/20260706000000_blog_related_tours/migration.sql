-- Curated related-tour pairings on Blog, matching Tour.relatedTours exactly
-- ({ tourId: string; ctaSentence: string }[] stored as a JSON string).
ALTER TABLE "Blog" ADD COLUMN "relatedTours" TEXT NOT NULL DEFAULT '[]';
