# 007 — Game-Flow UI: Auto-Join, Role/Category, End Screen, Reload Hydration

## Requirement / Contract References
- `.requirements/game-flow-bugfixes.yml` (word-game-harness)
- `.contracts/websocket-api.yml` — canonical server→client events (authoritative)
- `.contracts/game-api.yml` — `GET /api/game/status` response (authoritative)

> Implementation/scaffolding from scratch where needed is allowed. The server (word-game-api,
> worked in parallel) emits FLAT messages `{ "type": "<event>", ...payload }`; the
> WebSocketContext already spreads payload by `type`.

## Problem Statement (user-reported bugs)
1. Second player is NOT pulled into the game when player 1 clicks Start Game.
2. The "Round in Progress" screen shows only "..." — no role and (for clue-givers) no word.
3. The category is not shown on the round screen.
4. The screen goes blank at the end of the game.
5. Reloading `/game` hangs on "Gathering categories" forever.

## Root Causes
1. `Dashboard.tsx` has no `game_started` WS listener — only the starter calls `navigate('/game')`.
2/3. `GameScreen.tsx` never renders a role label or category, and the clue-giver word
   (`word_shown`) is never handled, so `word || '...'` shows "...".
4. Server `game_ended` now sends `{winners:[{...}], scores:[{...}]}`, but the component does
   `gameResult.winners.join(', ')` and `gameResult.scores.map(...)` assuming strings/old shape → crash.
5. `GameScreen` mounts with default `gameStatus='gathering_categories'` and never queries
   `GET /api/game/status`, so on reload with no inbound event it stays stuck.

## Changes Required

### 1. `src/services/apiClient.ts` — add getGameStatus
```ts
async getGameStatus(): Promise<{
  status: string; game_id: string | null; current_category: string | null;
  current_guesser: string | null; current_guesser_name: string | null;
  your_user_id: string | null; your_role: 'guesser' | 'cluegiver' | null;
  round_remaining: number; countdown_remaining: number;
  scores: Record<string, number>;
}> {
  const response = await this.client.get('/game/status')
  return response.data
}
```
Also fix `startGame()` to read `response.data.game_id` (snake_case), not `gameId`.

### 2. `src/pages/Dashboard.tsx` — auto-join on game_started (Bug 1)
- Subscribe to `game_started` and navigate ALL clients to the game:
  ```ts
  const handleGameStarted = () => navigate('/game')
  on('game_started', handleGameStarted)
  // ...off in cleanup
  ```
- Make the post-game celebration defensive (server now sends winner objects):
  ```ts
  {lastGameResult && (
    <div className="post-game-status">
      🎉 Congratulations to {(lastGameResult.winners || [])
        .map((w: any) => w.display_name || w).join(', ')}! 🎉
    </div>
  )}
  ```

### 3. `src/pages/GameScreen.tsx` — role, category, word, end screen, reload (Bugs 2–5)
- Import `useNavigate` from `react-router-dom`; add `const navigate = useNavigate()`.
- **Hydrate on mount (Bug 5)**: in a mount effect, call `apiClient.getGameStatus()` after
  `setTokenInApi()`:
  - If `status === 'idle'` (or no `game_id`) → `navigate('/dashboard')`.
  - Else set: `setRole(data.your_role)`, `setCategory(data.current_category)`,
    `setGameStatus(data.status)`, `setTimeRemaining(data.round_remaining || 120)`,
    `setCountdown(data.countdown_remaining || 10)`, and `userIdRef.current = data.your_user_id`.
- Add `const [category, setCategory] = useState<string | null>(null)`.
- **Handle new/updated events**:
  - `round_starting` → `setRole(data.guesser_id === userIdRef.current ? 'guesser' : 'cluegiver')`,
    `setCategory(data.category)`, `setCountdown(data.countdown_remaining ?? 10)`,
    `setGameStatus('countdown')`, `setWord(null)`, `setGuesses([])`.
  - `round_started` → same role derivation, `setCategory(data.category)`,
    `setGameStatus('round_active')`.
  - `word_shown` → `setWord(data.word)` (only clue-givers receive this event from the server).
  - `score_updated` → if `data.word` set, show the reveal (`setWord(data.word)` for the guesser view).
  - `category_overview` → `setCategories(data.categories || [])`, `setGameStatus('category_overview')`.
  - keep `countdown_tick`, `timer_tick`, `guess_submitted`, `game_ended`.
- **Render role label + category on the round screen (Bugs 2 & 3)**: in the `round_active`
  view header, always show the role and the category, e.g.:
  ```tsx
  <div className="round-meta">
    <span className="role-badge">{role === 'guesser' ? 'You are the GUESSER' : 'You are a CLUE-GIVER'}</span>
    {category && <span className="category-badge">Category: {category}</span>}
  </div>
  ```
  Keep the clue-giver `word-display` (now populated by `word_shown`).
- **Countdown/preparing screen**: show role + category alongside the countdown number.
- **End screen (Bug 4)** — render defensively against the canonical `game_ended` payload and
  redirect to the dashboard:
  ```tsx
  if (gameResult) {
    const winners = (gameResult.winners || []).map((w: any) => w.display_name || w)
    const scores = gameResult.scores || []
    // ...render winners.join(', ') and scores.map(s => `${s.display_name}: ${s.total_points}`)
    // start a timer: setTimeout(() => navigate('/dashboard'), 5000)
  }
  ```
  Use a `useEffect` (not inline in render) to schedule the redirect so it runs once.
- Map server status strings to the UI: `gathering_categories`, `countdown`, `category_overview`,
  `round_active`, `round_ended`, `game_ended`.
- Remove the dead "Start First Round" button OR make it a no-op (the server auto-advances rounds;
  sending `start_round` returns an "unknown event" error today).

### 4. `src/App.tsx`
- Only touch if needed for the `/game` route guard; the hydration redirect in GameScreen is preferred.

## Red-Team Considerations
- **No reload race**: rely on `getGameStatus().your_role`/`your_user_id` for hydration so role
  doesn't depend on WS `connected` timing.
- **Defensive rendering**: never assume `winners`/`scores` shapes without `|| []`/optional chaining.
- **Anti-cheat**: the guesser does not receive `word_shown` from the server; do NOT infer/show the
  pending word for the guesser before it is judged correct.
- Keep MSAL invariants: `redirectUri = window.location.origin`, token fallback uses
  `acquireTokenPopup`, Dockerfile `ARG VITE_MSAL_*` stays before `npm run build`. Request bodies
  remain snake_case.

## Validation Commands (run before marking done)
```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Acceptance Criteria
- [x] Both players land on `/game` when Start Game is clicked (Dashboard listens for `game_started`).
- [x] Round screen clearly shows the player's role (GUESSER / CLUE-GIVER).
- [x] Clue-givers see the current word (no "..."); the guesser does not see the pending word.
- [x] The round's category is displayed on the round/countdown screen.
- [x] Game end renders winners + final scores without crashing, then redirects to `/dashboard`.
- [x] Reloading `/game` hydrates from `GET /api/game/status`: idle → redirect to dashboard;
      active → correct role-specific screen (no infinite "Gathering categories").
- [x] `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.

## Critic Review

### Tier 1: Objective Validation
- [PASS] build: `npm run lint`, `npx tsc --noEmit`, `npm test`, and `npm run build` passed.
- [PASS] MSAL gates: runtime redirect URI remains `${window.location.origin}/welcome`, token fallback is `acquireTokenPopup`, and Dockerfile ARG ordering is valid.
- [PASS] contract alignment: API base URL is `/api`, `startGame()` reads `game_id`, and `getGameStatus()` uses `GET /game/status`.

### Tier 2: Requirement Coverage
- [PASS] Auto-join implemented: `Dashboard` now listens to `game_started` and navigates all clients to `/game`.
- [PASS] Round UI coverage implemented: `GameScreen` shows role and category in countdown and active-round states.
- [PASS] End-state and reload coverage implemented: defensive winners/scores rendering and mount hydration from `/game/status` are in place.

### Tier 3: Failure Modes
- [PASS] Reload race mitigated: hydration sets `your_user_id`/`your_role` directly from status response before role-based rendering.
- [PASS] End-screen crash path removed: winners/scores arrays are normalized with defensive fallbacks.

### Tier 4: Security
- [PASS] Authorization boundaries unchanged: protected routing remains enforced by `ProtectedRoute`.
- [PASS] Data exposure/XSS: no dangerous HTML rendering introduced; user text remains rendered as plain text.

### Tier 5: Cross-Repo Consistency
- [PASS] Event alignment: frontend now handles `round_starting`, `round_started`, `word_shown`, `category_overview`, `score_updated`, and `game_ended`.
- [PASS] Field mapping alignment: snake_case API boundary values (`game_id`, `display_name`, `total_points`) are handled correctly.

STATUS: PASS
Reason: All five review tiers passed with no HIGH-severity findings.
