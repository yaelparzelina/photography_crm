// Business days, counted from the shoot date, for delivering the edited photos
export const DEFAULT_BUSINESS_DAYS = 15

// Business days, counted from the client's print approval, for delivering the album (agreement text)
export const ALBUM_DELIVERY_DAYS = 7

// Empty or invalid values fall back to the default (same behavior as the album defaults)
export function normalizeBusinessDays(value) {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_BUSINESS_DAYS
}
