// Where a client came from ("איך הגיע?"). Stored as the key; "other" keeps free text in `leadSourceOther`.
export const LEAD_SOURCES = [
  { value: 'instagram', label: 'אינסטגרם' },
  { value: 'facebook', label: 'פייסבוק' },
  { value: 'midrag', label: 'מדרג' },
  { value: 'google', label: 'גוגל' },
  { value: 'referral', label: 'המלצה' },
  { value: 'other', label: 'אחר' },
]

export function leadSourceLabel(client) {
  if (client?.leadSource === 'other') return client.leadSourceOther?.trim() || 'אחר'
  return LEAD_SOURCES.find((s) => s.value === client?.leadSource)?.label || ''
}
