// Shape of a Careers application record, persisted as a JSON file (via
// saveJson) rather than a database row — the Careers module's design keeps
// zero candidate PII in the database (see src/app/api/careers/apply/route.ts).
// This record + the resume upload together ARE the application.
export interface CareersApplicationRecord {
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  currentCompany?: string;
  noticePeriod?: string;
  coverLetter?: string;
  resumeUrl: string;
  resumePublicId: string | null;
  submittedAt: string;
}

/** Storage folder for a given job's application records — one folder per job. */
export function applicationsFolder(jobId: string): string {
  return `careers/applications/${jobId}`;
}
