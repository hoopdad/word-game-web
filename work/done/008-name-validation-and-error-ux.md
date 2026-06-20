# 008 — Accurate name availability + validation error UX

Source of truth: word-game-harness `.requirements/registration-name-validation.yml`
and `.contracts/game-api.yml` (`/api/users/register`, `/api/users/profile`,
`/api/users/check-name/{name}`).

You are the word-game-web specialist. **Write all changes directly to files** using
edit/create — do not describe changes in prose only. The app is built with Vite from the
`.tsx` sources; update `.tsx` (the committed `.js` artifacts are rebuilt by `npm run build`,
so do not hand-edit `.js`).

## Problem (confirmed live)
Registering a new display name shows "That name is taken" for names that are NOT taken.
Backend now returns **422** for invalid format and **409** only for a true conflict
(see word-game-api change 009). Today the web has three defects:

1. `src/services/apiClient.ts::checkNameAvailability` returns `response.status === 200`,
   ignoring the `{available: boolean}` body — so it ALWAYS reports "Available" and never
   warns before submit.
2. `src/pages/NameEntry.tsx` (the registration page) does NOT validate the name format
   client-side; it only checks length. So names with disallowed characters reach the
   server. (Note: `src/pages/Profile.tsx` already has
   `const DISPLAY_NAME_REGEX = /^[A-Za-z0-9 ]{2,20}$/` and gates on it — reach parity.)
3. Submit handlers in `NameEntry.tsx` and `Profile.tsx` map ANY 409 to "that name is
   taken" and ignore the server `detail`, so a 422 format error would still be confusing.

## Required changes
1. **`src/services/apiClient.ts`** — `checkNameAvailability` must return the body field:
   ```ts
   const response = await this.client.get(`/users/check-name/${encodeURIComponent(name)}`)
   return response.data?.available === true
   ```
   Keep a defensive catch (network/other errors) but do NOT treat HTTP 200 as available
   unconditionally. Update any apiClient test that asserts the old behavior.

2. **Shared validation** — centralize the allowed-name regex so NameEntry and Profile use
   the same rule (`/^[A-Za-z0-9 ]{2,20}$/`). Either export it from a small util/module
   (e.g. `src/utils/validation.ts` exporting `DISPLAY_NAME_REGEX` and
   `isDisplayNameValid`) or reuse Profile's. Refactor Profile to import the shared copy.

3. **`src/pages/NameEntry.tsx`**:
   - Add client-side format validation using the shared `isDisplayNameValid`.
   - Show a format hint (e.g. "2-20 letters, numbers, and spaces") when the typed name is
     non-empty but invalid; disable the submit button when invalid (parity with Profile).
   - Only call `checkNameAvailability` for names that pass the format check.

4. **Submit error handling** in BOTH `NameEntry.tsx` and `Profile.tsx`:
   - On `409` -> show "That name is taken".
   - On `422` -> show the server `detail` (e.g.
     `error.response?.data?.detail`) so the user sees the real format requirement;
     fall back to a sensible default if `detail` is missing.
   - Other errors -> existing generic failure message.

## Constraints / red-team
- Client-side validation is advisory; the server stays the source of truth.
- Do not change MSAL/auth, routing, or unrelated pages.
- Keep `encodeURIComponent` on the check-name path param (names may contain spaces).
- Ensure the availability indicator can now legitimately show "taken" (when
  `available === false`) — verify the existing `isAvailable === false` UI still renders.
- Do not introduce a new HTTP client or dependency.

## Validation commands (run before marking done)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test` (if present)

## Critic Review

### Tier 1: Objective Validation
- [PASS] build: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test` passed.
- [PASS] MSAL gates: runtime `redirectUri` uses `window.location.origin`, token fallback remains `acquireTokenPopup` (no redirect fallback), and Dockerfile `ARG VITE_MSAL_*` ordering remains valid.
- [PASS] contract alignment: API base URL remains `/api`; API paths and snake_case payloads align (`/users/register`, `/users/profile`, `/users/check-name/{name}`, `display_name`).

### Tier 2: Requirement Coverage
- [PASS] `checkNameAvailability` now uses `response.data?.available === true`.
- [PASS] Shared display name validation (`/^[A-Za-z0-9 ]{2,20}$/`) is centralized and imported by both `NameEntry` and `Profile`.
- [PASS] `NameEntry` now enforces client-side format validation, shows invalid-format guidance, disables submit while invalid, and only performs availability checks for format-valid names.
- [PASS] `NameEntry` and `Profile` submit handlers now map `409` to "That name is taken", `422` to server `detail` with fallback, and other statuses to generic failure messaging.

### Tier 3: Failure Modes
- [PASS] Availability and submit async operations provide explicit error states and preserve user input for correction/retry.

### Tier 4: Security
- [PASS] No auth boundary, storage, or XSS regressions introduced; user-provided values remain text-rendered.

### Tier 5: Architecture/Decision Compliance
- [PASS] Changes are scoped to validation/error UX and API parsing, without altering MSAL flow, routing model, or introducing new dependencies.

STATUS: PASS
Reason: All five tiers passed with no HIGH-severity findings.
