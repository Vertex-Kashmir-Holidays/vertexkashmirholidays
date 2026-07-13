// Serializable shapes passed from the about page (server) to its client sections.

export interface AboutHeroData {
  breadcrumb: string | null;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  imageMobile: string | null;
  ctaPrimaryLabel: string | null;
  ctaPrimaryHref: string | null;
  ctaSecondaryLabel: string | null;
  ctaSecondaryHref: string | null;
}

export interface AboutStoryData {
  kicker: string | null;
  title: string | null;
  body: string | null;
  image: string | null;
}

export interface AboutStoryFeatureData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface AboutStatData {
  id: string;
  value: string;
  label: string;
  icon: string;
}

export interface AboutSectionHeading {
  kicker: string | null;
  title: string | null;
  subtitle: string | null;
}

export interface AboutValueData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface CertificationData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface LicensesData {
  businessName: string | null;
  registrationNumber: string | null;
  authority: string | null;
}

export interface TeamMemberData {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  /** CSS object-position (e.g. "50% 20%") for this member's photo crop. */
  imageFocus: string | null;
}

export interface AboutTeamHeading {
  kicker: string | null;
  title: string | null;
}

export interface JourneyMilestoneData {
  id: string;
  year: string;
  detail: string;
  icon: string;
}

export interface AboutCtaData {
  title: string | null;
  subtitle: string | null;
  image: string | null;
  whatsappLabel: string | null;
  whatsappHref: string | null;
  callLabel: string | null;
  callHref: string | null;
  emailLabel: string | null;
  emailHref: string | null;
}
