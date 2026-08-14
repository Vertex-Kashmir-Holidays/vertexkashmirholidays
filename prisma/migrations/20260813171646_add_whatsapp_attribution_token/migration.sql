-- CreateTable
CREATE TABLE "WhatsAppAttributionToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "gclid" TEXT,
    "gbraid" TEXT,
    "wbraid" TEXT,
    "fbclid" TEXT,
    "msclkid" TEXT,
    "landingPage" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppAttributionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAttributionToken_token_key" ON "WhatsAppAttributionToken"("token");

-- CreateIndex
CREATE INDEX "WhatsAppAttributionToken_expiresAt_idx" ON "WhatsAppAttributionToken"("expiresAt");
