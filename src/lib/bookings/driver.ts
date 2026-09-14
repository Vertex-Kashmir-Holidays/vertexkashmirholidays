// Shared rules for the booking's assigned driver/vehicle details.
//
// Driver details may be added/edited by staff only after services are locked,
// up through the end of the travel start day (so staff can still assign a
// driver on the morning of the tour). Both the API (authoritative) and the
// admin UI (to disable controls) use `canEditDriver` so the cutoff can never
// drift between them.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True while the driver details may still be added or changed: `now` has not
 * yet passed the end of the travel date. `now` is injectable for tests.
 */
export function canEditDriver(travelDate: Date | string, now: Date = new Date()): boolean {
  const travel = typeof travelDate === "string" ? new Date(travelDate) : travelDate;
  return now.getTime() < travel.getTime() + ONE_DAY_MS;
}

export interface DriverDetails {
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  vehicleName: string;
}

/** True when a booking has driver details saved (driverName is the marker). */
export function hasDriverDetails(b: { driverName: string | null }): boolean {
  return !!b.driverName && b.driverName.trim().length > 0;
}
