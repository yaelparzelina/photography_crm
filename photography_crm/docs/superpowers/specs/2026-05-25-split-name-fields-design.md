# Split Name Fields Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single `name` field on clients with two separate `firstName` and `lastName` fields, displayed side-by-side in forms and concatenated in the dashboard table.

**Architecture:** A helper `getClientName(client)` derives the display name everywhere — `[firstName, lastName].filter(Boolean).join(' ')` — with a legacy fallback to the old `name` field so existing Firestore records display correctly without migration. The canonical storage fields are `firstName` and `lastName`; `name` is never written to for new or updated clients.

**Tech Stack:** React, Firestore, Tailwind CSS, Vitest/Testing Library

---

## Affected Files

| File | Change |
|------|--------|
| `src/utils/clientUtils.js` | **Create** — exports `getClientName(client)` helper |
| `src/hooks/useClients.js` | Update default state: replace `name` with `firstName`, `lastName` |
| `src/components/NewClientModal.jsx` | Split "שם מלא" into two side-by-side required fields |
| `src/pages/ClientTicket.jsx` | Split "שם מלא" into two side-by-side inputs; use `getClientName` in header/delete message |
| `src/pages/Dashboard.jsx` | Use `getClientName` for display; search firstName+lastName+legacy name; sort by `firstName` |
| `src/components/AgreementEditorModal.jsx` | Build `clientName` via `getClientName` |
| `src/components/__tests__/NewClientModal.test.jsx` | Update tests for split fields |
| `src/pages/__tests__/ClientTicket.test.jsx` | Update test fixtures and assertions |
| `src/pages/__tests__/Dashboard.test.jsx` | Update test fixtures and assertions |
| `src/components/__tests__/AgreementEditorModal.test.jsx` | Update test fixtures |

---

## Detailed Design

### `getClientName(client)` helper

```js
// src/utils/clientUtils.js
export function getClientName(client) {
  const full = [client?.firstName, client?.lastName].filter(Boolean).join(' ')
  return full || client?.name || ''
}
```

- New clients: returns `"firstName lastName"`
- Old clients with only `name`: returns `name`
- Client with only `firstName`: returns `firstName`
- Null/undefined client: returns `''`

---

### `useClients.js` — default state

Change:
```js
name: '',
```
To:
```js
firstName: '',
lastName: '',
```

---

### `NewClientModal.jsx` — form split

- Form state: `{ firstName: '', lastName: '', phone: '', photoshootTypeId: '' }`
- Replace single "שם מלא" input with a `flex gap-3` row containing:
  - Right input: label "שם *", field `firstName`, required
  - Left input: label "שם משפחה *", field `lastName`, required
- Validation: both `firstName.trim()` and `lastName.trim()` must be non-empty before `addDoc`
- `addDoc` payload: `{ firstName, lastName, phone, photoshootTypeId, ... }` — no `name` field

---

### `ClientTicket.jsx` — form split

- Form initial state (populated from Firestore): `firstName: data.firstName || data.name || '', lastName: data.lastName || ''`
  - This is the backward-compat fallback: old clients get their `name` in `firstName`, empty `lastName`
- Replace "שם מלא" input with a `flex gap-3` row:
  - Right input: label "שם", field `firstName`
  - Left input: label "שם משפחה", field `lastName`
- Page header: `getClientName(client)` (was `client.name`)
- Delete confirmation message: `getClientName(client)` (was `client.name`)
- `handleSave` writes `{ firstName: form.firstName, lastName: form.lastName, ... }` — no `name` field

---

### `Dashboard.jsx` — display, search, sort

- Table "שם" column: display `getClientName(c)` (was `c.name`)
- Sort: `handleSort('firstName')` (was `'name'`); column header click target updated
- Search filter: checks `c.firstName`, `c.lastName`, and legacy `c.name`:
  ```js
  c.firstName?.toLowerCase().includes(q) ||
  c.lastName?.toLowerCase().includes(q) ||
  c.name?.toLowerCase().includes(q) ||
  c.email?.toLowerCase().includes(q) ||
  c.phone?.includes(q)
  ```

---

### `AgreementEditorModal.jsx` — clientName

Change:
```js
clientName: client.name,
```
and
```js
clientName: client?.name || '',
```
To use `getClientName(client)` from the helper.

---

## Backward Compatibility

No Firestore migration needed. The `getClientName` fallback and the ClientTicket initial-state fallback together ensure existing records display correctly. When a user saves an existing client from the ticket page, the record gains `firstName`/`lastName` fields and the old `name` field is no longer updated (but remains in Firestore — harmless).

---

## Validation Rules

| Field | Rule |
|-------|-------|
| `firstName` | Required in NewClientModal (blocks submit). Optional in ClientTicket (no block — consistent with current behavior of other fields). |
| `lastName` | Required in NewClientModal (blocks submit). Optional in ClientTicket. |
