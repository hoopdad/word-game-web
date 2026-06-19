# 005 — WebSocket Dispatch + Dashboard Game Flow + GameScreen Events

## Requirement Reference
- `.requirements/bugfix-batch-dashboard-game-flow.yml` in word-game-harness

## Problem Statement
Multiple live bugs traced to frontend WebSocket/game logic:
1. WebSocket dispatch passes `message.data` (undefined) because backend sends flat messages `{type, ...payload}` not `{type, data: {...}}`
2. Dashboard sends `start_game` via WebSocket (backend rejects as unknown event) instead of REST `POST /api/game/start`
3. Start Game button shown even with only 1 user (should require 2+)
4. GameScreen listens for non-existent events (`game_status_updated`, `role_assigned`, `categories_ready`) instead of actual backend events (`game_started`, `round_started`, `countdown_tick`)

## Changes Required

### 1. `src/context/WebSocketContext.tsx`
In `ws.onmessage` handler, change:
```typescript
// BEFORE (broken — message.data is undefined for flat messages)
emit(message.type, message.data)

// AFTER (spread payload without type)
const { type, ...payload } = message
emit(type, payload)
```

### 2. `src/pages/Dashboard.tsx`
- Remove `send` from `useWebSocket()` destructuring (no longer needed)
- Change `handleStartGame` to call REST API:
```typescript
const handleStartGame = async () => {
  try {
    await setTokenInApi()
    await apiClient.startGame()
    navigate('/game')
  } catch (error) {
    console.error('Failed to start game:', error)
  }
}
```
- Gate Start Game button: `{activeUsers.length >= 2 && (<button ...>Start Game</button>)}`
- Fix `handleUserJoined` to read `data.display_name || data.user` (handles both field names)
- Fix `handleUserLeft` similarly

### 3. `src/pages/GameScreen.tsx`
- Add `useRef` import, add `userIdRef` to capture user_id from `connected` event
- Replace event subscriptions:
  - `game_status_updated` → `game_started` (read `data.status`)
  - `role_assigned` → derive role from `round_started` event's `data.guesser_id === userIdRef.current`
  - `categories_ready` → `category_overview` (backend sends this between rounds)
  - `guess_correct` → `score_updated`
  - Timer handler: `data.remainingSeconds` → `data.remaining` (match backend field name)
  - Countdown handler: same, use `data.remaining`
- Remove unused `guesser` state (role derived from guesser_id comparison)
- Initial `gameStatus` should be `'gathering_categories'` (game already started when navigating here)
- Fix render conditions: remove the `countdown > 0` stuck-screen condition, use `gameStatus !== 'round_active'` as fallback waiting state

## Validation Commands
```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Acceptance Criteria
- [ ] WebSocket events from backend (flat payload) correctly dispatched to listeners
- [ ] Start Game button hidden when < 2 active users
- [ ] Start Game calls REST API, not WebSocket
- [ ] GameScreen shows proper state transitions (gathering → countdown → round_active)
- [ ] No lint errors, TypeScript compiles, build succeeds

## Critic Review

### Tier 1: Objective Validation
- [PASS] build: `npm run lint`, `npm test`, `npx tsc --noEmit`, and `npm run build` all passed.
- [PASS] MSAL gates: `redirectUri` uses `window.location.origin`, token fallback uses `acquireTokenPopup`, and Dockerfile `ARG VITE_MSAL_*` remains before `RUN npm run build`.
- [PASS] contract alignment: start game now uses REST (`POST /api/game/start` via relative `/api` base URL) and touched fields/events remain snake_case aligned.

### Tier 2: Requirement Coverage
- [PASS] Flat WebSocket dispatch implemented in `WebSocketContext.tsx` (`const { type, ...payload } = message; emit(type, payload)`).
- [PASS] Dashboard hides Start Game when fewer than 2 users are active.
- [PASS] Dashboard starts game via REST API (`apiClient.startGame()`), not a WebSocket `start_game` event.
- [PASS] GameScreen subscriptions/flow updated for `game_started`, `round_started`, `category_overview`, `countdown_tick`, and `score_updated`, including countdown/round-active transition handling.

### Tier 3: Failure Modes
- [PASS] Round state now resets safely on each `round_started` event (guesses/word/countdown reset), and malformed guess payloads are ignored.
- [NOTE] LOW: dashboard API failures are currently console-only and do not surface a user-facing retry/error message.

### Tier 4: Security
- [PASS] No new HTML injection path introduced; user/game text remains React-rendered text.
- [PASS] No auth boundary regression introduced by this change set.

### Tier 5: Architecture/Decision Compliance
- [PASS] Architecture intent preserved: REST for game start, WebSocket for live game events, payload field names aligned with backend event shape.

STATUS: PASS
Reason: All required criteria are satisfied and quality gates pass; only non-blocking LOW-severity notes remain.
