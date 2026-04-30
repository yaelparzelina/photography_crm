# Photography CRM — Product Design Spec
**Date:** 2026-04-30
**Status:** Approved

---

## 1. Product Overview

A small, focused CRM web application for a single professional photography business owner. The sole end-user of the dashboard is the business owner. Clients interact only with two isolated public pages (cost proposal view and work agreement signing).

**Language:** Hebrew throughout. Full RTL layout.
**Hosting:** GitHub Pages (static).
**Backend:** Firebase (Firestore database + Firebase Auth).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS + `tailwindcss-rtl` plugin |
| Routing | React Router v6 (HashRouter — required for GitHub Pages) |
| Database | Firebase Firestore |
| Authentication | Firebase Auth (email + password, single user) |
| Real-time sync | `react-firebase-hooks` |
| Icons | `lucide-react` |
| Font | Heebo or Assistant (Google Fonts, Hebrew-optimized) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions (auto-deploy on push to `main`) |

---

## 3. URL Routes

All routes use hash-based routing (`/#/...`) for GitHub Pages compatibility.

| Route | Access | Description |
|---|---|---|
| `/#/` | Public | Redirects to `/#/dashboard` or `/#/login` |
| `/#/login` | Public | Owner login page |
| `/#/dashboard` | Protected | Client list — main dashboard view |
| `/#/dashboard/clients/:id` | Protected | Single client ticket view/edit |
| `/#/dashboard/settings` | Protected | Pricing & photoshoot type management |
| `/#/client/:linkId` | Public | Client-facing cost proposal (view only) |
| `/#/sign/:linkId` | Public | Client-facing work agreement signing |

Protected routes redirect to `/#/login` if no active Firebase Auth session exists.

---

## 4. Data Model (Firestore)

### 4.1 `clients/{clientId}`

```
name               String       Client full name
email              String       May be empty initially; filled when client signs
phone              String       Israeli phone number
photoshootTypeId   String       ref → photoshootTypes/{id}
dateOfBirth        Timestamp    Optional
shootDate          Timestamp    Scheduled photoshoot date
packageId          String       ref → packages/{id}
price              Number       Final agreed price in ILS
paidAdvance        Boolean      Default: false
status             String       See status enum below
agreementSigned    Boolean      Default: false
agreementSignedAt  Timestamp    Set automatically when client signs
notes              String       Optional free text
createdAt          Timestamp    Auto-set on creation
```

**Status enum:**
- `new_lead` — default on creation
- `proposal_sent`
- `agreement_sent`
- `agreement_signed` — set automatically when client submits signing page
- `shoot_scheduled`
- `editing_in_progress`
- `done`
- `didnt_book`

### 4.2 `photoshootTypes/{typeId}`

```
name               String       e.g. "בת מצווה"
order              Number       Controls display order in dropdowns
createdAt          Timestamp
```

Initial types: בת מצווה, בר מצווה, משפחה, גיל שנה, תדמית, הריון, בוק שחקן, דורות

### 4.3 `packages/{packageId}`

```
photoshootTypeId   String       ref → photoshootTypes/{id}
name               String       e.g. "קלאסיק"
price              Number       Price in ILS
photoCount         Number       Number of edited photos included
locationCount      Number       Number of shooting locations included
includesAlbum      Boolean      Whether a printed album is included
albumSize          String       e.g. "30x30" (only if includesAlbum = true)
albumPages         Number       Default page count (only if includesAlbum = true)
order              Number       Controls display order within the type
createdAt          Timestamp
```

Notes:
- A photoshoot type may have 2 or 3 packages (not fixed).
- Package names may repeat across types (e.g. "קלאסיק") but with different specs.

### 4.4 `links/{linkId}`

```
clientId           String       ref → clients/{id}
type               String       "proposal" | "agreement"
active             Boolean      false = deactivated or superseded by new link
customPhotoCount   Number       Owner override (agreement only); null = use package default
customAlbumSize    String       Owner override (agreement only); null = use package default
customAlbumPages   Number       Owner override (agreement only); null = use package default
createdAt          Timestamp
deactivatedAt      Timestamp    Set when owner deactivates or regenerates
```

Link ID is a randomly generated string (no guessable pattern).

---

## 5. Application Pages

### 5.1 Login (`/#/login`)

- Centered card layout
- Email + password fields (Firebase Auth)
- Hebrew error messages on failure
- On success → redirect to `/#/dashboard`
- No "forgot password" flow (single known user)

### 5.2 Client List — Main Dashboard (`/#/dashboard`)

The primary view. Full-width sortable, searchable table.

**Table columns:** שם | סטטוס | סוג צילום | תאריך צילום | חבילה | שילם מקדמה | חוזה נחתם

**Features:**
- Real-time search bar (filters by name, phone, email)
- Sort by clicking any column header
- Filter dropdown by status
- Colorful status badge per row (each status has a distinct color)
- "+ לקוח חדש" button — opens new client form
- Clicking a row navigates to that client's ticket

**Status badge colors:**
- `new_lead` → Blue
- `proposal_sent` → Purple
- `agreement_sent` → Amber
- `agreement_signed` → Teal
- `shoot_scheduled` → Indigo
- `editing_in_progress` → Orange
- `done` → Green
- `didnt_book` → Red

### 5.3 Client Ticket (`/#/dashboard/clients/:id`)

Full editable client record. All fields editable inline with a Save button.

**Sections:**

1. **פרטי לקוח** — Name, email, phone, date of birth
2. **פרטי הצילום** — Photoshoot type (dropdown), shoot date (date picker), package (dropdown filtered to selected type), price, paid advance (toggle)
3. **סטטוס** — Status dropdown with live badge preview
4. **מסמכים** — Two action cards:
   - הצעת מחיר: "צור קישור" → generates proposal link, shows copy button
   - הסכם עבודה: "צור/ערוך הסכם" → opens Agreement Editor Modal, then shows copy button
5. **חתימת לקוח** — Shows signed status + timestamp if signed; "ממתין לחתימה" if not

**Destructive actions (all require confirmation popup):**
- Delete client: "האם אתה בטוח שברצונך למחוק את הלקוח [שם]? פעולה זו אינה ניתנת לביטול."
- Regenerate agreement after signing: "יצירת קישור חדש תבטל את החתימה הקיימת של הלקוח. הלקוח יצטרך לחתום מחדש על ההסכם המעודכן. להמשיך?"

### 5.4 Agreement Editor Modal

Opened before generating a Work Agreement link. Pre-fills from the client's selected package. Owner can override before confirming.

**Editable fields:**
- מספר תמונות (pre-filled from `package.photoCount`)
- כולל אלבום toggle (pre-filled from `package.includesAlbum`)
  - If true: גודל אלבום (pre-filled from `package.albumSize`, editable)
  - If true: מספר עמודים (pre-filled from `package.albumPages`, editable)

On confirm → new `links` document created → link displayed with copy button.

### 5.5 Settings (`/#/dashboard/settings`)

Two tabs:

**Tab 1 — סוגי צילום:**
- List of all photoshoot types with edit/delete per row
- Reorder via up/down arrows
- Add new type form
- Delete confirmation: warns that associated packages will also be deleted

**Tab 2 — חבילות:**
- Select a photoshoot type from dropdown
- Shows all packages for that type
- Edit each package's fields inline
- Delete package (with confirmation)
- Add new package button

### 5.6 Client Cost Proposal (`/#/client/:linkId`)

Public, no authentication required.

- Loads `links/{linkId}` document
- If `active = false` → shows: "קישור זה אינו פעיל יותר. אנא צור קשר עם הצלמת."
- If active → fetches photoshoot type + all its packages
- Renders a beautiful, branded, read-only Hebrew page showing all packages with specs and prices
- No client interaction — view only

### 5.7 Client Work Agreement Signing (`/#/sign/:linkId`)

Public, no authentication required.

- Loads `links/{linkId}` document
- If `active = false` → shows: "קישור זה אינו פעיל יותר. אנא צור קשר עם הצלמת."
- If active → fetches client + package data + any link-level overrides
- Renders the full personalized Work Agreement (HTML template) with:
  - Today's date
  - Client name
  - Photoshoot type
  - Chosen package name
  - Scheduled shoot date
  - Photo count (custom override or package default)
  - Album details (if applicable, with custom overrides)
  - Price

**Below the agreement:**
- Email input: "אנא הזיני את כתובת המייל שלך לאישור ההסכם"
- Submit button: "אני מאשר/ת את ההסכם"
- On submit:
  1. Validates email format
  2. Writes to `clients/{clientId}`: `email`, `agreementSigned: true`, `agreementSignedAt`, `status: "agreement_signed"`
  3. Shows success message: "תודה! ההסכם אושר בהצלחה."
  4. Owner dashboard updates in real-time via Firestore listener

---

## 6. Document Templates (HTML)

Both document types are rendered as styled HTML pages — no PDF library or external API required. The browser's print function can produce a PDF if needed.

### Cost Proposal Template
- Displays all packages for the selected photoshoot type
- Shows per-package: name, price, photo count, location count, album inclusion + specs
- Branded with business name and today's date
- One template structure, data populated dynamically per photoshoot type

### Work Agreement Template
- Fully personalized per client
- Populated fields: today's date, client name, photoshoot type, package name, shoot date, photo count, album details (if applicable), price
- Owner can adjust photo count and album specs before generating link
- Rendered on the signing page (`/#/sign/:linkId`)

---

## 7. Security

### Firebase Auth
- Single owner account, credentials set during initial setup
- All `/dashboard/*` routes check auth state on load
- No session → immediate redirect to `/#/login`

### Firestore Security Rules

```
Authenticated owner:
  → Full read/write on all collections

Unauthenticated user:
  → Read: single links document by exact ID only
  → Read: single clients document linked to that link only (needed for both
          proposal and agreement pages — to get name, type, shoot date, etc.)
  → Read: all photoshootTypes documents (read-only — non-sensitive pricing info
          needed by the proposal page to display packages)
  → Read: all packages documents (read-only — same reason)
  → Write: only email, agreementSigned, agreementSignedAt, status fields
            on the specific client document linked to that link
  → No write access to photoshootTypes or packages
  → No list access to clients — can only read the one document by exact ID
  → No access to any other client documents
```

### Link Security
- Link IDs are randomly generated (cryptographically random, not guessable)
- Deactivated links (`active: false`) show an expired message regardless of URL possession
- Regenerating an agreement link sets old link to `active: false` and resets client signing status

---

## 8. RTL & Design System

### RTL Configuration
- `<html dir="rtl" lang="he">` at root
- Tailwind RTL plugin mirrors all directional utilities
- All UI text in Hebrew
- Dates in `DD/MM/YYYY` format
- Currency as `₪` prefix

### Visual Design Principles
- Background: off-white `#F9FAFB`
- Cards: white, subtle shadow, `rounded-2xl`
- Typography: Heebo font, clear size hierarchy
- Buttons: filled (primary), outlined (secondary), red outline (destructive)
- Modals: centered overlay with backdrop blur, Cancel + Confirm buttons
- Spacing: generous — no crowding

### Confirmation Popups (required for all destructive actions)
- Delete client
- Delete photoshoot type
- Delete package
- Deactivate a link
- Regenerate a signed agreement link

---

## 9. Out of Scope

The following are explicitly excluded to keep the project focused:

- Calendar view
- Invoicing or payment processing
- Sending WhatsApp/email from within the app (owner copies links manually)
- Multi-user or team access
- Client portal beyond proposal and signing pages
- Image gallery or photo delivery
- Archive section (done clients remain in main list)
- Forgot password flow
- Email notifications (dashboard updates in real-time instead)
