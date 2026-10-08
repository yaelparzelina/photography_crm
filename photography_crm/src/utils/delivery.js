// Business days, counted from the shoot date, for delivering the edited photos
export const DEFAULT_BUSINESS_DAYS = 10

// Empty or invalid values fall back to the default (same behavior as the album defaults)
export function normalizeBusinessDays(value) {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_BUSINESS_DAYS
}
