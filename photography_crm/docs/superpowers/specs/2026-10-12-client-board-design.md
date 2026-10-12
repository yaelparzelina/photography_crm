# לוח לקוחות (client board): design

## Goal
A kanban board becomes the new home page (`/dashboard`). It tracks each client from first contact to delivery.
The current list moves to "מאגר לקוחות" (`/dashboard/clients`).

## Columns (right to left)
| # | Column | Statuses it holds | Status set on drop |
|---|--------|-------------------|--------------------|
| 1 | לקוחות חדשים | new_lead | new_lead |
| 2 | הצעת מחיר נשלחה | proposal_sent | proposal_sent |
| 3 | לחזור ללקוח | proposal_sent | proposal_sent |
| 4 | סגירת חוזה והנחיות לבוש (top half) | proposal_sent, agreement_sent, agreement_signed | signed → agreement_signed; contract sent → agreement_sent; otherwise proposal_sent |
| 5 | לא סגר (bottom half) | didnt_book | didnt_book |
| 6 | לפני צילום | shoot_scheduled | shoot_scheduled |
| 7 | עריכת תמונות | editing_in_progress | editing_in_progress |
| 8 | משלוח אלבום | editing_in_progress | editing_in_progress |
| 9 | הסתיים | done | done |

- The client's column is stored as `boardColumn` and is valid only if the column holds the client's status.
  Otherwise the default column for the status is used: proposal_sent → 2, agreement_* → 4, editing → 7.
  This way a status change anywhere else (the client card, the clients list, the agreement link, signing) moves the ticket to the right place.
- Every move or status change records `boardMovedAt`. A status change made outside the board resets `boardColumn` and `boardHidden`.
- `agreementSentAt` is recorded when an agreement link is created.
- In "לא סגר" and "הסתיים", a ticket disappears 7 days after `boardMovedAt`. Existing clients count from the launch date (2026-10-12).
  A ticket can be removed earlier ("הסר מהלוח", which sets `boardHidden: true`, per ticket or for the whole column). The client is never deleted.

## Ticket
- Shows the full name and shoot type.
- Tags:
  - Shoot date: shown before the editing columns.
  - Delivery deadline: shown in columns 7–8 only. It shows the date and the business days left. It is orange when 2 days or fewer are left and red when overdue.
  - Event date.
  - Callback date: column 3. It is orange on the day itself or once the date has passed.
  - Status chip: column 4 only.
- Icons: deposit paid, includes album.
- WhatsApp button, when there is a phone number.
- A "⋯" menu with "move to…", plus "הסר מהלוח" in columns 5 and 9.
- Clicking a ticket opens the client card. "Back" returns to the board.
- Column 3: "תאריך לחזרה" date picker on the ticket. The date is also editable on the card.
- Column 4: "הנחיות לבוש" button. It opens "הודעות ללקוח" showing only the guide messages that match the shoot type, with the client filled in.
- Column 6: "הודעה לפני צילום" button, which opens the pre-shoot message with the client filled in. A "נשלחה" toggle sets `preShootMessageSentAt` (✓ on the ticket).
- Ordering:
  - Columns 6–8 are sorted automatically: column 6 by nearest shoot, columns 7–8 by nearest deadline.
  - All other columns are ordered manually. Drag a ticket within its column, or use "הזזה למעלה/למטה" in the ⋯ menu.
  - The position is saved as `boardOrder`; a lower number means higher up. A ticket arriving in a column goes to the top.
  - Clients without a saved position fall back to most recently moved first.
- Columns 4 and 6: a ticket without a shoot date shows a "+ תאריך צילום" chip that opens the calendar.
- Hover hints explain the ₪, album and WhatsApp icons.
- Contract chips have their own icons: ⏳ טרם נשלח חוזה, ✈ חוזה נשלח, ✓ חוזה נחתם.

## Date picker (site-wide, added 2026-10-12)
- Every date field uses `DateInput` (components/ui/DatePicker.jsx). You can type dd/mm/yyyy (also d/m/yy, dd.mm.yyyy or yyyy-mm-dd) or pick from a calendar.
- The calendar is in Hebrew and runs Sunday to Saturday, right to left.
- It has month and year pickers and marks holidays with a dot. Its footer has "היום" and "נקה תאריך".
- Board date chips use the same calendar (`DatePopover`).

## Business days
- Deadline = shoot date + N business days (the client's `businessDays`, default 15 — 10 until 2026-10-12).
- Day 1 is the first business day after the shoot.
- Fridays, Saturdays and holiday days don't count: ראש השנה (2 days), יום כיפור, סוכות, שמחת תורה, פסח first and seventh day, שבועות, and יום העצמאות (with its moving rules).
- Holidays are computed with `Intl` and the Hebrew calendar, so no table needs to be maintained.

## Other
- New client from column 1: the existing new-client form. The ticket appears in column 1 and the page doesn't navigate away.
- Drag and drop uses @dnd-kit/core (mouse, touch, keyboard). An undo toast appears after every move.
- A placeholder "הודעה לפני צילום" message (`kind: 'pre_shoot'`) is seeded once. The owner will rewrite its text.
- Navigation: "לוח לקוחות" (home), "מאגר לקוחות" (list).

## Testing
- Unit tests:
  - Business days and holidays, checked against known dates.
  - Column resolution.
  - Drop status.
  - Expiry.
  - Ordering.
- Board page:
  - Render.
  - Move by menu.
  - Callback date.
  - Pre-shoot toggle.
  - Remove from board.
  - Undo.
- App smoke test for the new routes.
