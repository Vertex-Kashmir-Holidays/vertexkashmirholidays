-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ItineraryStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'SALES', 'EDITOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."TourCategory" AS ENUM ('HONEYMOON', 'FAMILY', 'ADVENTURE', 'LUXURY');

-- CreateTable
CREATE TABLE "public"."AboutContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroBreadcrumb" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "heroCtaPrimaryLabel" TEXT,
    "heroCtaPrimaryHref" TEXT,
    "heroCtaSecondaryLabel" TEXT,
    "heroCtaSecondaryHref" TEXT,
    "storyKicker" TEXT,
    "storyTitle" TEXT,
    "storyBody" TEXT,
    "storyImage" TEXT,
    "statsImage" TEXT,
    "valuesKicker" TEXT,
    "valuesTitle" TEXT,
    "valuesSubtitle" TEXT,
    "teamKicker" TEXT,
    "teamTitle" TEXT,
    "teamCtaLabel" TEXT,
    "teamCtaHref" TEXT,
    "journeyKicker" TEXT,
    "journeyTitle" TEXT,
    "pressLabel" TEXT,
    "ctaTitle" TEXT,
    "ctaSubtitle" TEXT,
    "ctaImage" TEXT,
    "ctaWhatsappLabel" TEXT,
    "ctaWhatsappHref" TEXT,
    "ctaCallLabel" TEXT,
    "ctaCallHref" TEXT,
    "ctaEmailLabel" TEXT,
    "ctaEmailHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroImageMobile" TEXT,

    CONSTRAINT "AboutContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AboutStat" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AboutStoryFeature" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutStoryFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AboutValue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "coverImage" TEXT,
    "author" TEXT,
    "category" TEXT,
    "readTime" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "authorBio" TEXT,
    "authorRole" TEXT,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroKicker" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "heroSearchPlaceholder" TEXT,
    "aboutTitle" TEXT,
    "aboutText" TEXT,
    "aboutCtaLabel" TEXT,
    "aboutCtaHref" TEXT,
    "newsletterTitle" TEXT,
    "newsletterText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroImageMobile" TEXT,

    CONSTRAINT "BlogContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPayId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "travelDate" TIMESTAMP(3) NOT NULL,
    "travellers" INTEGER NOT NULL DEFAULT 1,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "accent" TEXT NOT NULL DEFAULT 'hsl(196 90% 52%)',
    "accent2" TEXT NOT NULL DEFAULT 'hsl(170 80% 50%)',
    "particles" TEXT NOT NULL DEFAULT 'snow',
    "name" TEXT NOT NULL,
    "badge" TEXT,
    "titleHtml" TEXT,
    "sub" TEXT,
    "heroImage" TEXT,
    "finalImage" TEXT,
    "facts" TEXT NOT NULL DEFAULT '[]',
    "heroCta" TEXT,
    "proofCount" TEXT,
    "offerText" TEXT,
    "offerDeadline" TIMESTAMP(3),
    "offerSeats" TEXT,
    "navCta" TEXT,
    "phone" TEXT,
    "whatsappHref" TEXT,
    "strip" TEXT NOT NULL DEFAULT '[]',
    "stats" TEXT NOT NULL DEFAULT '[]',
    "filmTitle" TEXT,
    "filmDuration" TEXT,
    "filmPoster" TEXT,
    "filmSrc" TEXT,
    "highlightsTitle" TEXT,
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "activitiesTitle" TEXT,
    "activities" TEXT NOT NULL DEFAULT '[]',
    "itineraryTitle" TEXT,
    "itinerary" TEXT NOT NULL DEFAULT '[]',
    "tiers" TEXT NOT NULL DEFAULT '[]',
    "batches" TEXT NOT NULL DEFAULT '[]',
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "exclusions" TEXT NOT NULL DEFAULT '[]',
    "galleryTitle" TEXT,
    "gallery" TEXT NOT NULL DEFAULT '[]',
    "testimonials" TEXT NOT NULL DEFAULT '[]',
    "faqsTitle" TEXT,
    "faqs" TEXT NOT NULL DEFAULT '[]',
    "finalTitle" TEXT,
    "finalSub" TEXT,
    "finalCta" TEXT,
    "finalNote" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroImageMobile" TEXT,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroBreadcrumb" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "reachKicker" TEXT,
    "reachTitle" TEXT,
    "promiseKicker" TEXT,
    "promiseTitle" TEXT,
    "officeKicker" TEXT,
    "officeTitle" TEXT,
    "officeSubtitle" TEXT,
    "officeName" TEXT,
    "officeAddress" TEXT,
    "officeHours" TEXT,
    "officeMapLabel" TEXT,
    "officeMapSubLabel" TEXT,
    "directionsUrl" TEXT,
    "faqsKicker" TEXT,
    "faqsTitle" TEXT,
    "faqsCtaLabel" TEXT,
    "faqsCtaHref" TEXT,
    "testimonialsKicker" TEXT,
    "testimonialsTitle" TEXT,
    "socialKicker" TEXT,
    "socialTitle" TEXT,
    "socialText" TEXT,
    "socialCtaLabel" TEXT,
    "socialCtaHref" TEXT,
    "formKicker" TEXT,
    "formTitle" TEXT,
    "formNote" TEXT,
    "whatsappFloatText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroImageMobile" TEXT,

    CONSTRAINT "ContactContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactHeroFeature" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactHeroFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactOffice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContactPromiseItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactPromiseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "excerpt" TEXT,
    "tagline" TEXT,
    "coverImage" TEXT,
    "location" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gallery" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HeroSlide" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageMobile" TEXT,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroBadge" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroCtaPrimaryLabel" TEXT,
    "heroCtaPrimaryHref" TEXT,
    "heroCtaSecondaryLabel" TEXT,
    "heroCtaSecondaryHref" TEXT,
    "formKicker" TEXT,
    "formTitle" TEXT,
    "formSubtitle" TEXT,
    "formButtonLabel" TEXT,
    "formNote" TEXT,
    "formAvatars" TEXT NOT NULL DEFAULT '[]',
    "aboutPara1" TEXT,
    "aboutPara2" TEXT,
    "aboutImage1" TEXT,
    "aboutImage2" TEXT,
    "aboutCardEmoji" TEXT,
    "aboutCardTitle" TEXT,
    "aboutCardSubtitle" TEXT,
    "aboutRatingTitle" TEXT,
    "aboutRatingSubtitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kicker" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "travelDate" TIMESTAMP(3),
    "travellers" INTEGER,
    "message" TEXT,
    "source" TEXT DEFAULT 'website',
    "status" "public"."InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Itinerary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."ItineraryStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JourneyMilestone" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegalPage" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "public"."NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Offer" (
    "id" TEXT NOT NULL,
    "badge" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "oldPrice" DOUBLE PRECISION,
    "endsText" TEXT,
    "validUntil" TIMESTAMP(3),
    "ctaHref" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PressLogo" (
    "id" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "siteName" TEXT NOT NULL DEFAULT 'Vertex Kashmir Holidays',
    "siteTagline" TEXT,
    "siteEmail" TEXT,
    "sitePhone" TEXT,
    "siteAddress" TEXT,
    "whatsapp" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteStat" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "suffix" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "avatar" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TickerItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tour" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "description" TEXT,
    "category" "public"."TourCategory" NOT NULL,
    "duration" INTEGER NOT NULL,
    "coverImage" TEXT,
    "badge" TEXT,
    "badgeColor" TEXT DEFAULT 'green',
    "gallery" TEXT NOT NULL DEFAULT '[]',
    "itinerary" TEXT NOT NULL DEFAULT '[]',
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "exclusions" TEXT NOT NULL DEFAULT '[]',
    "priceFrom" DOUBLE PRECISION NOT NULL,
    "priceWas" DOUBLE PRECISION,
    "discountPct" INTEGER,
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bestTime" TEXT,
    "difficulty" TEXT,
    "faqs" TEXT NOT NULL DEFAULT '[]',
    "happyCount" INTEGER,
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "pickupDrop" TEXT,
    "startCity" TEXT,
    "tagline" TEXT,
    "tourType" TEXT,
    "transport" TEXT,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TourDestination" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "TourDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoReview" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "place" TEXT,
    "duration" TEXT,
    "thumbnail" TEXT NOT NULL,
    "videoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhyChooseItem" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhyChooseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AboutStat_isActive_sortOrder_idx" ON "public"."AboutStat"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "AboutStoryFeature_isActive_sortOrder_idx" ON "public"."AboutStoryFeature"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "AboutValue_isActive_sortOrder_idx" ON "public"."AboutValue"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "Blog_category_idx" ON "public"."Blog"("category" ASC);

-- CreateIndex
CREATE INDEX "Blog_featured_idx" ON "public"."Blog"("featured" ASC);

-- CreateIndex
CREATE INDEX "Blog_publishedAt_idx" ON "public"."Blog"("publishedAt" ASC);

-- CreateIndex
CREATE INDEX "Blog_published_idx" ON "public"."Blog"("published" ASC);

-- CreateIndex
CREATE INDEX "Blog_slug_idx" ON "public"."Blog"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "public"."Blog"("slug" ASC);

-- CreateIndex
CREATE INDEX "Blog_trending_idx" ON "public"."Blog"("trending" ASC);

-- CreateIndex
CREATE INDEX "BlogCategory_isActive_sortOrder_idx" ON "public"."BlogCategory"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "public"."BlogCategory"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "public"."BlogCategory"("slug" ASC);

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "public"."Booking"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_razorpayOrderId_key" ON "public"."Booking"("razorpayOrderId" ASC);

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "public"."Booking"("status" ASC);

-- CreateIndex
CREATE INDEX "Booking_tourId_idx" ON "public"."Booking"("tourId" ASC);

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId" ASC);

-- CreateIndex
CREATE INDEX "Campaign_published_idx" ON "public"."Campaign"("published" ASC);

-- CreateIndex
CREATE INDEX "Campaign_slug_idx" ON "public"."Campaign"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "public"."Campaign"("slug" ASC);

-- CreateIndex
CREATE INDEX "ContactFaq_isActive_sortOrder_idx" ON "public"."ContactFaq"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "ContactHeroFeature_isActive_sortOrder_idx" ON "public"."ContactHeroFeature"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "ContactOffice_isActive_sortOrder_idx" ON "public"."ContactOffice"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "ContactPromiseItem_isActive_sortOrder_idx" ON "public"."ContactPromiseItem"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "Destination_slug_idx" ON "public"."Destination"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "public"."Destination"("slug" ASC);

-- CreateIndex
CREATE INDEX "EmailOtp_email_idx" ON "public"."EmailOtp"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EmailOtp_email_key" ON "public"."EmailOtp"("email" ASC);

-- CreateIndex
CREATE INDEX "EmailOtp_expiresAt_idx" ON "public"."EmailOtp"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "Gallery_category_idx" ON "public"."Gallery"("category" ASC);

-- CreateIndex
CREATE INDEX "Gallery_type_idx" ON "public"."Gallery"("type" ASC);

-- CreateIndex
CREATE INDEX "HeroSlide_isActive_sortOrder_idx" ON "public"."HeroSlide"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HomeSection_key_key" ON "public"."HomeSection"("key" ASC);

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "public"."Inquiry"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "public"."Inquiry"("status" ASC);

-- CreateIndex
CREATE INDEX "Itinerary_ownerId_idx" ON "public"."Itinerary"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "Itinerary_status_idx" ON "public"."Itinerary"("status" ASC);

-- CreateIndex
CREATE INDEX "Itinerary_updatedAt_idx" ON "public"."Itinerary"("updatedAt" ASC);

-- CreateIndex
CREATE INDEX "JourneyMilestone_isActive_sortOrder_idx" ON "public"."JourneyMilestone"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "public"."NewsletterSubscriber"("email" ASC);

-- CreateIndex
CREATE INDEX "Offer_isActive_sortOrder_idx" ON "public"."Offer"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "PressLogo_isActive_sortOrder_idx" ON "public"."PressLogo"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "Review_approved_idx" ON "public"."Review"("approved" ASC);

-- CreateIndex
CREATE INDEX "Review_tourId_idx" ON "public"."Review"("tourId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_module_key" ON "public"."RolePermission"("role" ASC, "module" ASC);

-- CreateIndex
CREATE INDEX "SiteStat_section_sortOrder_idx" ON "public"."SiteStat"("section" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "TeamMember_isActive_sortOrder_idx" ON "public"."TeamMember"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "Testimonial_isActive_sortOrder_idx" ON "public"."Testimonial"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "TickerItem_isActive_sortOrder_idx" ON "public"."TickerItem"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "Tour_bestseller_idx" ON "public"."Tour"("bestseller" ASC);

-- CreateIndex
CREATE INDEX "Tour_category_idx" ON "public"."Tour"("category" ASC);

-- CreateIndex
CREATE INDEX "Tour_published_idx" ON "public"."Tour"("published" ASC);

-- CreateIndex
CREATE INDEX "Tour_slug_idx" ON "public"."Tour"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tour_slug_key" ON "public"."Tour"("slug" ASC);

-- CreateIndex
CREATE INDEX "TourDestination_destinationId_idx" ON "public"."TourDestination"("destinationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TourDestination_tourId_destinationId_key" ON "public"."TourDestination"("tourId" ASC, "destinationId" ASC);

-- CreateIndex
CREATE INDEX "TourDestination_tourId_idx" ON "public"."TourDestination"("tourId" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "VideoReview_isActive_sortOrder_idx" ON "public"."VideoReview"("isActive" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE INDEX "WhyChooseItem_isActive_sortOrder_idx" ON "public"."WhyChooseItem"("isActive" ASC, "sortOrder" ASC);

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "public"."Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Itinerary" ADD CONSTRAINT "Itinerary_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "public"."Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TourDestination" ADD CONSTRAINT "TourDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "public"."Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TourDestination" ADD CONSTRAINT "TourDestination_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "public"."Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

