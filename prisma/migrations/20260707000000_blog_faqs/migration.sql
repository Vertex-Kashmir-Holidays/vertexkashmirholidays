-- FAQ list on Blog, matching Tour.faqs exactly
-- ({ question: string; answer: string }[] stored as a JSON string).
ALTER TABLE "Blog" ADD COLUMN "faqs" TEXT NOT NULL DEFAULT '[]';
