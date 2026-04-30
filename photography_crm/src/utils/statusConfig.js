export const STATUS_CONFIG = {
  new_lead:            { label: 'ליד חדש',              color: 'bg-blue-100 text-blue-800' },
  proposal_sent:       { label: 'הצעת מחיר נשלחה',      color: 'bg-purple-100 text-purple-800' },
  agreement_sent:      { label: 'חוזה נשלח',             color: 'bg-amber-100 text-amber-800' },
  agreement_signed:    { label: 'חוזה נחתם',             color: 'bg-teal-100 text-teal-800' },
  shoot_scheduled:     { label: 'צילום מתוכנן',          color: 'bg-indigo-100 text-indigo-800' },
  editing_in_progress: { label: 'עריכה בתהליך',          color: 'bg-orange-100 text-orange-800' },
  done:                { label: 'הסתיים',                 color: 'bg-green-100 text-green-800' },
  didnt_book:          { label: 'לא סגר',                color: 'bg-red-100 text-red-800' },
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}))
