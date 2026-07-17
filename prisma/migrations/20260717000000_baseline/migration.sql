-- Baseline migration — replaces the entire prior migration history (archived
-- under prisma/migrations_archive/ for reference, not deleted).
--
-- The previous 46 migration files were riddled with gaps: entire tables
-- (Activity, ActivityDestination, ActivityTour, BookingPayment,
-- BookingService, ItineraryHistory, Notification, PaymentAudit), enum types
-- (PaymentType, ServiceKind, TourFormMode), and dozens of columns (most of
-- Booking's 43 columns among them) were added directly via `db:push` over
-- time and never promoted to a recorded migration, even though both the dev
-- and production databases matched the current schema exactly. The gap only
-- surfaced when `prisma migrate dev`'s shadow-database replay tried to apply
-- history from scratch and failed at the first missing piece.
--
-- This single migration is generated directly from the current schema
-- (`prisma migrate diff --from-empty --to-schema-datamodel`) and represents
-- the complete, accurate schema as of 2026-07-17 — verified to match both
-- the dev and production databases exactly before being adopted. It is
-- marked as already applied on both (via `prisma migrate resolve --applied`)
-- rather than executed, since both already have this exact state for real.
--
-- Going forward: one migration per sprint, not one per individual schema
-- change — see .ai/instructions/coding-standards.md → Database Standards.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'RESET');

-- CreateEnum
CREATE TYPE "OfflineConversionPlatform" AS ENUM ('GOOGLE', 'META', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "OfflineConversionStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "FaqStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FaqPlacement" AS ENUM ('HOME', 'ABOUT', 'CONTACT', 'FAQ', 'REVIEWS');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'DEVELOPER', 'SALES', 'EDITOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "TourCategory" AS ENUM ('HONEYMOON', 'FAMILY', 'ADVENTURE', 'LUXURY', 'BUDGET', 'GROUP', 'PILGRIMAGE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "TourRegion" AS ENUM ('KASHMIR', 'LADAKH');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('TOKEN', 'PARTIAL', 'FINAL', 'REFUND');

-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('HOTEL', 'TRANSPORT', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONNECTED', 'NOT_CONNECTED', 'QUALIFIED', 'NEGOTIATION', 'ON_HOLD', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'MANUAL', 'GOOGLE_ADS', 'META_ADS', 'THIRD_PARTY', 'REFERRAL');

-- CreateEnum
CREATE TYPE "TourFormMode" AS ENUM ('BOOKING_ONLY', 'INQUIRY_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "LeadCategory" AS ENUM ('HONEYMOON_TOUR', 'COUPLE', 'FAMILY_TOUR', 'GROUP_TOUR', 'SKI_TOUR', 'OFFBEAT_TOUR');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('STATUS_CHANGE', 'ASSIGNMENT_CHANGE', 'NOTE_ADDED', 'FOLLOW_UP_SCHEDULED', 'ATTACHMENT_ADDED', 'CALL_LOGGED', 'EMAIL_SENT', 'BOOKING_LINKED');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('ONLINE', 'AWAY', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('STRIP', 'PROMO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "bookingConversionPct" DOUBLE PRECISION,
    "mfaSecret" TEXT,
    "mfaEnabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ItineraryStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "ownerId" TEXT NOT NULL,
    "leadId" TEXT,
    "bookingId" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryHistory" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "editedById" TEXT,
    "editedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'REGISTER',
    "name" TEXT,
    "passwordHash" TEXT,
    "phone" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "resetTokenHash" TEXT,

    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "excerpt" TEXT,
    "tagline" TEXT,
    "coverImage" TEXT,
    "coverImageMobile" TEXT,
    "location" TEXT,
    "altitude" TEXT,
    "season" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "whyVisit" TEXT NOT NULL DEFAULT '[]',
    "topAttractions" TEXT NOT NULL DEFAULT '[]',
    "bestTimeDetail" TEXT,
    "howToReach" TEXT,
    "whereToStay" TEXT,
    "localFood" TEXT NOT NULL DEFAULT '[]',
    "shopping" TEXT NOT NULL DEFAULT '[]',
    "travelTips" TEXT NOT NULL DEFAULT '[]',
    "relatedBlogIds" TEXT NOT NULL DEFAULT '[]',
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "coverImageMobile" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "location" TEXT,
    "icon" TEXT,
    "duration" TEXT,
    "price" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "whyExperience" TEXT,
    "activityHighlights" TEXT NOT NULL DEFAULT '[]',
    "bestTime" TEXT,
    "difficulty" TEXT,
    "suitableFor" TEXT NOT NULL DEFAULT '[]',
    "pricingGuide" TEXT,
    "safetyTips" TEXT NOT NULL DEFAULT '[]',
    "whatToCarry" TEXT NOT NULL DEFAULT '[]',
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityDestination" (
    "activityId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "ActivityDestination_pkey" PRIMARY KEY ("activityId","destinationId")
);

-- CreateTable
CREATE TABLE "ActivityTour" (
    "activityId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "ActivityTour_pkey" PRIMARY KEY ("activityId","tourId")
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "description" TEXT,
    "category" "TourCategory" NOT NULL,
    "region" "TourRegion" NOT NULL DEFAULT 'KASHMIR',
    "duration" INTEGER NOT NULL,
    "coverImage" TEXT,
    "coverImageMobile" TEXT,
    "badge" TEXT,
    "badgeColor" TEXT DEFAULT 'green',
    "gallery" TEXT NOT NULL DEFAULT '[]',
    "itinerary" TEXT NOT NULL DEFAULT '[]',
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "exclusions" TEXT NOT NULL DEFAULT '[]',
    "priceFrom" DOUBLE PRECISION NOT NULL,
    "minPersons" INTEGER NOT NULL DEFAULT 1,
    "priceWas" DOUBLE PRECISION,
    "discountPct" INTEGER,
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "formMode" "TourFormMode" NOT NULL DEFAULT 'BOTH',
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bestTime" TEXT,
    "difficulty" TEXT,
    "batches" TEXT NOT NULL DEFAULT '[]',
    "happyCount" INTEGER,
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "pickupDrop" TEXT,
    "startCity" TEXT,
    "tagline" TEXT,
    "tourType" TEXT,
    "transport" TEXT,
    "perfectFor" TEXT NOT NULL DEFAULT '[]',
    "notIdealFor" TEXT NOT NULL DEFAULT '[]',
    "whyItineraryWorks" TEXT,
    "accommodation" TEXT NOT NULL DEFAULT '[]',
    "accommodationImage" TEXT,
    "meals" TEXT,
    "transportDetail" TEXT,
    "budgetBreakdown" TEXT NOT NULL DEFAULT '[]',
    "personalExpenses" TEXT NOT NULL DEFAULT '[]',
    "bestTimeDetail" TEXT,
    "thingsToCarry" TEXT NOT NULL DEFAULT '[]',
    "localTravelTips" TEXT NOT NULL DEFAULT '[]',
    "importantNotes" TEXT NOT NULL DEFAULT '[]',
    "whyVertexBlurb" TEXT,
    "ctaHeadline" TEXT,
    "ctaBody" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "relatedTours" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourDestination" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "TourDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tourId" TEXT,
    "userId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPayId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentOption" TEXT,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "travelEndDate" TIMESTAMP(3),
    "travellers" INTEGER NOT NULL DEFAULT 1,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestPhone" TEXT NOT NULL,
    "address" TEXT,
    "requirements" TEXT,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "servicesLocked" BOOLEAN NOT NULL DEFAULT false,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleNumber" TEXT,
    "vehicleName" TEXT,
    "driverAddedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'PARTIAL',
    "method" TEXT,
    "reference" TEXT,
    "gatewayOrderId" TEXT,
    "gatewaySignature" TEXT,
    "metadata" TEXT,
    "note" TEXT,
    "gstPercent" DOUBLE PRECISION,
    "gstAmount" DOUBLE PRECISION,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kind" "ServiceKind" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT,
    "nights" INTEGER,
    "roomType" TEXT,
    "pickup" TEXT,
    "dropoff" TEXT,
    "timing" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAudit" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "event" TEXT NOT NULL,
    "status" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "amount" DOUBLE PRECISION,
    "ip" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "sourcePage" TEXT,
    "category" "LeadCategory",
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "followUpAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "bookingId" TEXT,
    "negotiatedAmount" DOUBLE PRECISION,
    "tokenAmount" DOUBLE PRECISION,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineConversion" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "bookingId" TEXT,
    "platform" "OfflineConversionPlatform" NOT NULL,
    "status" "OfflineConversionStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "platformResponse" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "note" TEXT,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus",
    "fromAssigneeId" TEXT,
    "toAssigneeId" TEXT,
    "performedById" TEXT,
    "performedByName" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT,
    "coverImage" TEXT,
    "coverImageMobile" TEXT,
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
    "relatedTours" TEXT NOT NULL DEFAULT '[]',
    "quickAnswer" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogContent" (
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
    "ogImage" TEXT,

    CONSTRAINT "BlogContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
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
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "alt" TEXT,
    "caption" TEXT,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPage" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "heroImage" TEXT,
    "heroImageMobile" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "HomeContent" (
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
CREATE TABLE "HomeSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kicker" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "heroImage" TEXT,
    "heroImageMobile" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
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
CREATE TABLE "SiteStat" (
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
CREATE TABLE "TickerItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoReview" (
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
CREATE TABLE "WhyChooseItem" (
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

-- CreateTable
CREATE TABLE "Offer" (
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
CREATE TABLE "AboutContent" (
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
    "faqsKicker" TEXT,
    "faqsTitle" TEXT,
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
    "ogImage" TEXT,

    CONSTRAINT "AboutContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutStoryFeature" (
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
CREATE TABLE "AboutStat" (
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
CREATE TABLE "AboutValue" (
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
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageFocus" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyMilestone" (
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
CREATE TABLE "PressLogo" (
    "id" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewsContent" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroBreadcrumb" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "heroImageMobile" TEXT,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewsContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactContent" (
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
    "socialImage1" TEXT,
    "socialImage2" TEXT,
    "socialImage3" TEXT,
    "socialImage4" TEXT,
    "formKicker" TEXT,
    "formTitle" TEXT,
    "formNote" TEXT,
    "whatsappFloatText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroImageMobile" TEXT,
    "ogImage" TEXT,

    CONSTRAINT "ContactContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactHeroFeature" (
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
CREATE TABLE "ContactPromiseItem" (
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
CREATE TABLE "FaqCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "shortAnswer" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "FaqStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "placements" "FaqPlacement"[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactOffice" (
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
CREATE TABLE "Campaign" (
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
    "faqsTitle" TEXT,
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
CREATE TABLE "SiteSettings" (
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
    "googleReviews" TEXT,
    "tripadvisor" TEXT,
    "googleBusinessProfile" TEXT,
    "googlePlaceId" TEXT,
    "tripadvisorHeroWidgetEmbed" TEXT,
    "tripadvisorRatingWidgetEmbed" TEXT,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "ogImage" TEXT,
    "gstRates" TEXT NOT NULL DEFAULT '[5,16,18]',
    "showAnnouncementBanner" BOOLEAN NOT NULL DEFAULT false,
    "announcementMessage" TEXT,
    "legalName" TEXT,
    "tourismRegNumber" TEXT,
    "tourismRegAuthority" TEXT,
    "gstNumber" TEXT,
    "addressLine1" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressPincode" TEXT,
    "addressCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "type" "RoomType" NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "directKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "typingAt" TIMESTAMP(3),

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT,
    "attachmentUrl" TEXT,
    "attachmentPublicId" TEXT,
    "attachmentType" TEXT,
    "attachmentName" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "reactions" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPresence" (
    "userId" TEXT NOT NULL,
    "status" "PresenceStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPresence_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "title" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL DEFAULT 'AUDIO',
    "jitsiRoomId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "MeetingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "type" "BannerType" NOT NULL DEFAULT 'STRIP',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "imageUrl" TEXT,
    "imageMobileUrl" TEXT,
    "pages" TEXT NOT NULL DEFAULT '["*"]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DestinationToFaq" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DestinationToFaq_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ActivityToFaq" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivityToFaq_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogToFaq" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogToFaq_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FaqToTour" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FaqToTour_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CampaignToFaq" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampaignToFaq_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_role_deletedAt_idx" ON "User"("role", "deletedAt");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_userId_idx" ON "MfaRecoveryCode"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_leadId_key" ON "Itinerary"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_bookingId_key" ON "Itinerary"("bookingId");

-- CreateIndex
CREATE INDEX "Itinerary_ownerId_idx" ON "Itinerary"("ownerId");

-- CreateIndex
CREATE INDEX "Itinerary_status_idx" ON "Itinerary"("status");

-- CreateIndex
CREATE INDEX "Itinerary_updatedAt_idx" ON "Itinerary"("updatedAt");

-- CreateIndex
CREATE INDEX "Itinerary_lastEditedById_idx" ON "Itinerary"("lastEditedById");

-- CreateIndex
CREATE INDEX "ItineraryHistory_itineraryId_idx" ON "ItineraryHistory"("itineraryId");

-- CreateIndex
CREATE INDEX "ItineraryHistory_createdAt_idx" ON "ItineraryHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOtp_email_key" ON "EmailOtp"("email");

-- CreateIndex
CREATE INDEX "EmailOtp_expiresAt_idx" ON "EmailOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_module_key" ON "RolePermission"("role", "module");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "Activity_published_idx" ON "Activity"("published");

-- CreateIndex
CREATE INDEX "ActivityDestination_destinationId_idx" ON "ActivityDestination"("destinationId");

-- CreateIndex
CREATE INDEX "ActivityTour_tourId_idx" ON "ActivityTour"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "Tour_slug_key" ON "Tour"("slug");

-- CreateIndex
CREATE INDEX "Tour_category_idx" ON "Tour"("category");

-- CreateIndex
CREATE INDEX "Tour_region_idx" ON "Tour"("region");

-- CreateIndex
CREATE INDEX "Tour_published_idx" ON "Tour"("published");

-- CreateIndex
CREATE INDEX "Tour_bestseller_idx" ON "Tour"("bestseller");

-- CreateIndex
CREATE INDEX "TourDestination_tourId_idx" ON "TourDestination"("tourId");

-- CreateIndex
CREATE INDEX "TourDestination_destinationId_idx" ON "TourDestination"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "TourDestination_tourId_destinationId_key" ON "TourDestination"("tourId", "destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_razorpayOrderId_key" ON "Booking"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_tourId_idx" ON "Booking"("tourId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_deletedAt_createdAt_idx" ON "Booking"("deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_guestEmail_idx" ON "Booking"("guestEmail");

-- CreateIndex
CREATE INDEX "BookingPayment_bookingId_idx" ON "BookingPayment"("bookingId");

-- CreateIndex
CREATE INDEX "BookingPayment_createdAt_idx" ON "BookingPayment"("createdAt");

-- CreateIndex
CREATE INDEX "BookingService_bookingId_idx" ON "BookingService"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentAudit_bookingId_idx" ON "PaymentAudit"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentAudit_event_idx" ON "PaymentAudit"("event");

-- CreateIndex
CREATE INDEX "PaymentAudit_createdAt_idx" ON "PaymentAudit"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_category_idx" ON "Lead"("category");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_followUpAt_idx" ON "Lead"("followUpAt");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_bookingId_idx" ON "Lead"("bookingId");

-- CreateIndex
CREATE INDEX "OfflineConversion_status_idx" ON "OfflineConversion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineConversion_leadId_platform_key" ON "OfflineConversion"("leadId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineConversion_bookingId_platform_key" ON "OfflineConversion"("bookingId", "platform");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_performedAt_idx" ON "LeadActivity"("performedAt");

-- CreateIndex
CREATE INDEX "Review_tourId_idx" ON "Review"("tourId");

-- CreateIndex
CREATE INDEX "Review_approved_idx" ON "Review"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_tourId_key" ON "Review"("userId", "tourId");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_published_idx" ON "Blog"("published");

-- CreateIndex
CREATE INDEX "Blog_publishedAt_idx" ON "Blog"("publishedAt");

-- CreateIndex
CREATE INDEX "Blog_featured_idx" ON "Blog"("featured");

-- CreateIndex
CREATE INDEX "Blog_trending_idx" ON "Blog"("trending");

-- CreateIndex
CREATE INDEX "Blog_category_idx" ON "Blog"("category");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "BlogCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogCategory_isActive_sortOrder_idx" ON "BlogCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Gallery_category_idx" ON "Gallery"("category");

-- CreateIndex
CREATE INDEX "Gallery_type_idx" ON "Gallery"("type");

-- CreateIndex
CREATE INDEX "Gallery_sortOrder_createdAt_idx" ON "Gallery"("sortOrder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HomeSection_key_key" ON "HomeSection"("key");

-- CreateIndex
CREATE INDEX "HeroSlide_isActive_sortOrder_idx" ON "HeroSlide"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteStat_section_sortOrder_idx" ON "SiteStat"("section", "sortOrder");

-- CreateIndex
CREATE INDEX "TickerItem_isActive_sortOrder_idx" ON "TickerItem"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "VideoReview_isActive_sortOrder_idx" ON "VideoReview"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "WhyChooseItem_isActive_sortOrder_idx" ON "WhyChooseItem"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Offer_isActive_sortOrder_idx" ON "Offer"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "AboutStoryFeature_isActive_sortOrder_idx" ON "AboutStoryFeature"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "AboutStat_isActive_sortOrder_idx" ON "AboutStat"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "AboutValue_isActive_sortOrder_idx" ON "AboutValue"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Certification_isActive_sortOrder_idx" ON "Certification"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamMember_isActive_sortOrder_idx" ON "TeamMember"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "JourneyMilestone_isActive_sortOrder_idx" ON "JourneyMilestone"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PressLogo_isActive_sortOrder_idx" ON "PressLogo"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ContactHeroFeature_isActive_sortOrder_idx" ON "ContactHeroFeature"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ContactPromiseItem_isActive_sortOrder_idx" ON "ContactPromiseItem"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FaqCategory_slug_key" ON "FaqCategory"("slug");

-- CreateIndex
CREATE INDEX "FaqCategory_isActive_sortOrder_idx" ON "FaqCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Faq_slug_key" ON "Faq"("slug");

-- CreateIndex
CREATE INDEX "Faq_status_categoryId_sortOrder_idx" ON "Faq"("status", "categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "ContactOffice_isActive_sortOrder_idx" ON "ContactOffice"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_published_idx" ON "Campaign"("published");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_directKey_key" ON "ChatRoom"("directKey");

-- CreateIndex
CREATE INDEX "ChatRoom_archivedAt_idx" ON "ChatRoom"("archivedAt");

-- CreateIndex
CREATE INDEX "ChatRoom_type_idx" ON "ChatRoom"("type");

-- CreateIndex
CREATE INDEX "ChatRoom_createdById_idx" ON "ChatRoom"("createdById");

-- CreateIndex
CREATE INDEX "ChatMember_userId_idx" ON "ChatMember"("userId");

-- CreateIndex
CREATE INDEX "ChatMember_roomId_idx" ON "ChatMember"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_roomId_userId_key" ON "ChatMember"("roomId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_jitsiRoomId_key" ON "Meeting"("jitsiRoomId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "Meeting_createdById_idx" ON "Meeting"("createdById");

-- CreateIndex
CREATE INDEX "Meeting_roomId_idx" ON "Meeting"("roomId");

-- CreateIndex
CREATE INDEX "Meeting_createdAt_idx" ON "Meeting"("createdAt");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "MeetingParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "Banner_type_isActive_idx" ON "Banner"("type", "isActive");

-- CreateIndex
CREATE INDEX "Banner_sortOrder_idx" ON "Banner"("sortOrder");

-- CreateIndex
CREATE INDEX "_DestinationToFaq_B_index" ON "_DestinationToFaq"("B");

-- CreateIndex
CREATE INDEX "_ActivityToFaq_B_index" ON "_ActivityToFaq"("B");

-- CreateIndex
CREATE INDEX "_BlogToFaq_B_index" ON "_BlogToFaq"("B");

-- CreateIndex
CREATE INDEX "_FaqToTour_B_index" ON "_FaqToTour"("B");

-- CreateIndex
CREATE INDEX "_CampaignToFaq_B_index" ON "_CampaignToFaq"("B");

-- AddForeignKey
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryHistory" ADD CONSTRAINT "ItineraryHistory_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDestination" ADD CONSTRAINT "ActivityDestination_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDestination" ADD CONSTRAINT "ActivityDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTour" ADD CONSTRAINT "ActivityTour_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTour" ADD CONSTRAINT "ActivityTour_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDestination" ADD CONSTRAINT "TourDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDestination" ADD CONSTRAINT "TourDestination_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineConversion" ADD CONSTRAINT "OfflineConversion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineConversion" ADD CONSTRAINT "OfflineConversion_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPresence" ADD CONSTRAINT "UserPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DestinationToFaq" ADD CONSTRAINT "_DestinationToFaq_A_fkey" FOREIGN KEY ("A") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DestinationToFaq" ADD CONSTRAINT "_DestinationToFaq_B_fkey" FOREIGN KEY ("B") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToFaq" ADD CONSTRAINT "_ActivityToFaq_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToFaq" ADD CONSTRAINT "_ActivityToFaq_B_fkey" FOREIGN KEY ("B") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToFaq" ADD CONSTRAINT "_BlogToFaq_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToFaq" ADD CONSTRAINT "_BlogToFaq_B_fkey" FOREIGN KEY ("B") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FaqToTour" ADD CONSTRAINT "_FaqToTour_A_fkey" FOREIGN KEY ("A") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FaqToTour" ADD CONSTRAINT "_FaqToTour_B_fkey" FOREIGN KEY ("B") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToFaq" ADD CONSTRAINT "_CampaignToFaq_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToFaq" ADD CONSTRAINT "_CampaignToFaq_B_fkey" FOREIGN KEY ("B") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

