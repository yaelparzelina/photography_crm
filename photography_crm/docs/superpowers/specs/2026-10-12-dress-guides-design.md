# הנחיות לבוש (dress guides): design

## Goal
Public, client-independent landing pages with dress guidelines (family, bat mitzvah, modest bat mitzvah,
bar mitzvah), editable by the owner. There is a "הנחיות לבוש" section to copy the links, and a ready message for
each page in "הודעות ללקוח".

## Decisions (agreed with the user)
- Content is editable in the app. The owner can add and delete pages.
- PDF text is proofread: spelling unified and punctuation fixed, wording and meaning unchanged.
- Photos appear on the family page only by default (7 inspiration photos, site marks cropped). Any page can get photos.
- Photos are stored in Firestore (resized in the browser to a JPEG data URL under ~700 KB). No Firebase Storage.
- Message titles: "הנחיות לבוש לצילומי משפחה", "הנחיות לבוש לבוק בת מצווה",
  "הנחיות לבוש לבוק בת מצווה (לבוש צנוע)", "הנחיות לבוש לבוק בר מצווה".
  Text: "היי, מצרפת הנחיות לבוש לצילומים: <link>".

## Data (Firestore)
- `dressGuides/{slug}` holds `name`, `title`, `subtitle`, `intro`, `paletteText`, `palette: [{name, color}]`,
  `tips: [{type: 'do'|'dont', text}]`, `outfits: [string]`, `note`, `closing`, `signoff`, `photoIds: [string]`,
  `order`, `messageTemplateId`, `createdAt` and `updatedAt`. Seeded slugs are `family`, `bat-mitzvah`,
  `bat-mitzvah-modest` and `bar-mitzvah`. New pages get a random 8-character slug.
- `dressGuidePhotos/{id}` holds `{ data, guideId, createdAt }`.
- `settings/dressGuides` is the "seeded" flag. Seeding runs once in a transaction from DashboardLayout. It creates the 4 guides, the family
  photos (from `public/dress-guides/`) and the 4 message templates (`guideId` set, appended after the existing messages).
- Rules: anonymous `get` (not `list`) on `dressGuides` and `dressGuidePhotos`.

## Public page `#/dress/:slug`
The page uses a warm cream background with the logo at the top. Headings use the serif font Frank Ruhl Libre, and the body text uses Heebo.
Sections appear in this order; an empty section is hidden:
1. Title and subtitle.
2. Intro.
3. "פלטת הצבעים": text, then round swatches with names.
4. "חשוב לדעת": ✓ / ✕ tips.
5. "רעיונות לסטים של בגדים": numbered cards.
6. Note.
7. "תמונות להשראה": masonry gallery.
8. Closing card, with a WhatsApp button (wa.me/972548788851) and the sign-off.

If the page is missing, a friendly "not found" message is shown. The same `DressGuideView` component is used by the editor preview.

## Owner side
- A nav item "הנחיות לבוש" leads to `/dashboard/dress-guides`. It shows a card for each page with the name, CopyLink, "תצוגה" (opens the public page),
  "עריכה" and "מחיקה", plus "+ דף הנחיות חדש".
- The editor is at `/dashboard/dress-guides/:slug` (or `new`). The form is on one side and a live preview on the other.
  - Lists can be edited: palette (name and colour picker, with the colour auto-suggested from known names), tips (do/don't) and outfits.
  - Photos can be uploaded, reordered and removed.
  - Photo docs are written or deleted only on save.
  - Leaving with unsaved changes asks for confirmation.
- Saving a new page creates its message template. Renaming a page updates the template title.
  Deleting a page deletes the guide, its photos and its message (the confirm dialog says so).
- Links use `publicUrl()`: the production origin when running on localhost, so links saved from dev still work.

## Testing
- Unit tests: the colour map and the image-scaling math.
- Public page: render, hidden empty sections, not-found.
- Section list: copy and delete flow.
- Editor: save data, photo add and remove, new page creates its message.
- Seed builds the expected docs.
- App smoke test for the routes.
