# 006 — Dashboard presence convergence (periodic active-user refresh)

> Specialist directive: implement by WRITING changes directly to the listed files
> using edit/create tools. Do not describe changes in prose only.

## Requirement Reference
- `.requirements/fix-startgame-timeout-presence-ttl.yml` (in word-game-harness)

## Problem Statement
Active-user presence flaps on the dashboard: a user does not appear to others on
login, and reloading the dashboard hides the other user until that user also
reloads. The API is being changed to a 600s inactivity-TTL presence model and will
stop broadcasting `user_left` on mere disconnect (only on true TTL expiry). To make
the dashboard converge with that model — and self-heal any WebSocket broadcasts
missed during reconnect backoff churn — the dashboard must periodically re-fetch the
authoritative active-user list.

## Changes Required (write to files)

### `src/pages/Dashboard.tsx`
- Add a polling effect that calls `apiClient.getActiveUsers()` on an interval
  (every 30 seconds) while the dashboard is mounted and the user `isAuthenticated`,
  and replaces `activeUsers` state with the fetched list (authoritative source).
  - Ensure the token is set first (`await setTokenInApi()`), matching the existing
    `fetchData` pattern.
  - Clear the interval on unmount (return cleanup from the effect).
  - Guard against overlapping/async state updates after unmount.
- Keep the existing `user_joined` / `user_left` WebSocket handlers (they still
  provide instant updates); the periodic refresh reconciles drift and removes users
  that expired server-side.
- Do not duplicate names — continue de-duping (the existing `new Set(...)` pattern).

## Constraints
- No change to API request/response shapes; reuse `apiClient.getActiveUsers()`
  (`GET /api/users/active`, returns `users[].display_name`).
- Keep the 30s interval lightweight; do not poll other endpoints.
- Follow existing lint/build conventions; no new dependencies.

## Validation Commands
```bash
# from word-game-web repo root — run the repo's configured scripts
npm run lint
npm run test
npm run build
```

## Acceptance
- With another user active, reloading the dashboard does NOT hide them (the API now
  retains them via TTL, and the periodic refresh keeps the list correct).
- A user who goes inactive for > 10 minutes disappears from the list within ~30s of
  TTL expiry without requiring a manual reload.
- Lint, tests, and build pass.

---

## Critic Review

### Tier 1: Objective Validation
- [PASS] build: lint 0 warnings, 75/75 tests, tsc + vite build succeeded
- [PASS] MSAL gates: no auth files changed; redirectUri/acquireTokenPopup/Dockerfile unaffected
- [PASS] contract alignment: reuses existing getActiveUsers() (GET /users/active); no new endpoints or field mappings

### Tier 2: Requirement Coverage
- [PASS] Reload convergence: polling effect fetches authoritative list every 30s, replacing WS-derived state
- [PASS] TTL expiry within ~30s: interval fires at 30000ms calling authoritative API
- [PASS] Token set first: await setTokenInApi() called before getActiveUsers() in poll
- [PASS] Cleanup: clearInterval on unmount
- [PASS] Stale update guard: cancelled flag checked before setActiveUsers
- [PASS] De-dupe preserved: [...new Set(users)] applied to poll result
- [PASS] WebSocket handlers kept intact for instant updates

### Tier 3: Failure Modes
- [PASS] Poll errors caught and logged; component keeps existing activeUsers state
- [PASS] cancelled flag prevents stale state if unmount races in-flight request
- [NOTE] Token refresh failure in poll is caught silently — matches existing fetchData pattern (LOW)

### Tier 4: Security
- [PASS] No new localStorage/sessionStorage usage
- [PASS] display_name rendered as text (no dangerouslySetInnerHTML)
- [PASS] No new data exposure surface

### Tier 5: Cross-Repo Consistency
- [PASS] getActiveUsers() response destructuring unchanged (response.data.users[].display_name)
- [PASS] No new WebSocket event type strings introduced

STATUS: PASS
Reason: All acceptance criteria satisfied; lint/test/build pass; no security or contract issues.
