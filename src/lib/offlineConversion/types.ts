import type { OfflineConversionPlatform } from "@prisma/client";
import type { AttributionData } from "@/lib/attribution";

// Platform-agnostic conversion event. The CRM never speaks Google/Meta/
// Microsoft-specific shapes — only this. Each adapter translates it into its
// own platform's upload format.
export interface ConversionEvent {
  attribution: AttributionData;
  conversionValue?: number;
  currency: string;
  conversionTime: Date;
  email?: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
  /**
   * Stable idempotency key for the queue row (its own id). Optional — only
   * the Google adapter uses it today (as order_id, for platform-side dedup
   * on top of our own DB-level unique constraint). Meta/Microsoft ignore it.
   */
  dedupeKey?: string;
}

export interface PlatformAdapterResult {
  success: boolean;
  response?: unknown;
  error?: string;
}

export interface PlatformAdapter {
  platform: OfflineConversionPlatform;
  /** True when the env vars this adapter needs are present. */
  isConfigured(): boolean;
  send(event: ConversionEvent): Promise<PlatformAdapterResult>;
}
