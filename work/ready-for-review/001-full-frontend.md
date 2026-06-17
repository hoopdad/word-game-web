# Work Request: Frontend — Full Game UI

## References
- Requirements: `.requirements/user-management.yml`, `.requirements/game-lobby.yml`, `.requirements/game-rounds.yml`, `.requirements/auth.yml`, `.requirements/platform-guardrails.yml`
- Contracts: `.contracts/game-api.yml`, `.contracts/websocket-api.yml`
- Guardrails: `.copilot/guardrails/nfr.yml`
- Pattern docs: `external-user-pattern.md` (in guardrails)

## Context
This is a **greenfield repo**. Scaffold the complete React/TypeScript SPA from scratch.
This is the frontend for a multiplayer word-guessing game with real-time gameplay via WebSocket.

## Acceptance Criteria

### 1. Project Setup
- React 18 with TypeScript (strict mode)
- Vite for build tooling
- Vitest for unit tests
- ESLint + Prettier + eslint-plugin-security
- Multi-stage Dockerfile (Node builder + nginx runtime, run as non-root)
- `.env.template` for configuration (API URL, MSAL client ID, authority)
- `tsconfig.json` with `strict: true`

### 2. Authentication (MSAL / Entra External ID)
- Install `@azure/msal-browser` and `@azure/msal-react`
- MSAL configuration:
  - PKCE auth flow (public client)
  - `sessionStorage` for token cache (NOT localStorage)
  - Hardcoded redirect URI (NOT `window.location.origin`)
  - Authority from env config (Entra External ID / CIAM tenant)
- `AuthProvider` wrapping the entire app
- `useAuth` hook for login/logout/token access
- Protected routes: only landing page is public; all other routes require auth
- Token acquisition: use `acquireTokenSilent` with fallback to `acquireTokenRedirect`
- Pass access token in `Authorization: Bearer` header for API calls

### 3. Landing Page (Public)
- Route: `/welcome`
- Clean, responsive design
- Login/Signup button (triggers MSAL redirect)
- Dark/light mode toggle (persisted in localStorage — non-sensitive)
- App name/branding
- No game content exposed without auth
- WCAG 2.1 AA accessible

### 4. Name Entry (Post-Auth, Pre-Dashboard)
- Shown when user has no display name set
- Text input for display name (2-20 chars)
- Real-time availability check via `GET /api/users/check-name/{name}` (debounced)
- Submit calls `POST /api/users/register`
- Error display: "that name is taken" on 409
- On success: redirect to dashboard

### 5. Dashboard
- Shows only after auth + name registration
- **Active Users Card**: live list of connected users (updated via WebSocket `user_joined`/`user_left`)
- **Game Count Card**: total games ever played (from `GET /api/scores/game-count`)
- **All-Time Top 10 Card**: leaderboard (from `GET /api/scores/all-time`)
- **Today's Top 3 Card**: daily leaders (from `GET /api/scores/today`)
- **Start Game Button**: visible when no game in progress; calls `POST /api/game/start` or sends WS `start_game`
- **Configure Categories Link**: navigates to category config page
- **Post-Game Status Bar**: celebrates winner(s) of the last game

### 6. Category Configuration Page
- Accessible from dashboard link
- Display current URLs (from `GET /api/categories/config`)
- Add/remove URLs (validate URL format client-side)
- Save calls `PUT /api/categories/config`
- Back button to dashboard

### 7. Game Screens

#### 7a. Gathering Categories
- Shown when game status is `gathering_categories`
- Loading animation with "Gathering categories..." text
- Receives `categories_ready` WebSocket event

#### 7b. Category Overview
- Shows all categories (one per user) with names
- "Start First Round" button (sends WS `start_round`)

#### 7c. Role Assignment + Countdown
- Shows user's role: "You are the GUESSER" or "You are a CLUE-GIVER"
- Shows who the guesser is
- 10-second countdown (visual, from `countdown_tick` events)

#### 7d. Round Active (Clue-Giver View)
- Shows the current word prominently
- Shows the guesser's guesses as they come in (from `guess_submitted`)
- "Correct!" button to judge guess correct (sends WS `judge_correct`)
- Round timer (2 minutes, from `timer_tick` events)
- Score display

#### 7e. Round Active (Guesser View)
- Text input for guesses (sends WS `submit_guess`)
- NO word shown (guesser must not see the word)
- On correct guess: word revealed for 3 seconds (from `guess_correct`)
- Round timer
- Score display

#### 7f. Round End
- Shows round results (points earned, guesser name)
- "Next Round" or auto-advance

#### 7g. Game End
- Shows winner(s) with celebration
- Final scores for all players
- Indicates if any records were broken (all-time or daily)
- Auto-returns to dashboard after a delay

### 8. Game In Progress (Late Joiner)
- If a user connects while game is in progress
- Shows "Game in progress. Please wait."
- Polls game status until game ends, then shows dashboard

### 9. WebSocket Integration
- **Auth**: Request a one-time ticket from REST endpoint, send as first WS message (do NOT put JWT in query string)
- Connection management: auto-reconnect with exponential backoff
- Handle all server events per `.contracts/websocket-api.yml`
- React context/provider for WebSocket state
- Render all text content as text (not HTML) to prevent XSS from display names, guesses, or AI-generated words

### 10. API Client
- Typed API client for all REST endpoints per `.contracts/game-api.yml`
- Axios or fetch with auth interceptor (attach Bearer token)
- Error handling with user-friendly messages

### 11. Security
- CSP meta tag: prevent inline scripts
- X-Frame-Options: DENY
- No `dangerouslySetInnerHTML` anywhere
- Strict input validation on all user inputs
- Display names, guesses rendered as text only (no HTML interpretation)

### 12. CI/CD
- `.github/workflows/ci.yml`: eslint, vitest, vite build on self-hosted runner
- `.github/workflows/cd.yml`: Docker build (multi-stage with nginx), push to ACR, update Container App; OIDC auth; triggers after CI on main
- Dockerfile must be production-ready (nginx serving static build)

### 13. Tests
- Vitest unit tests for:
  - Auth flows (mock MSAL)
  - Game state management
  - WebSocket message handling
  - Name validation
  - Score display
- Aim for ≥80% coverage

## Platform Constraints (from `.requirements/platform-guardrails.yml`)
- React 18 with TypeScript (strict mode)
- Vite / Vitest / Playwright
- MSAL.js with PKCE, sessionStorage cache
- ESLint + Prettier + eslint-plugin-security
- Multi-stage Dockerfile, run as non-root

## Validation
- `npm run lint`
- `npm test`
- `npm run build`

## Implementation Status: COMPLETE WITH FIXES

✅ All acceptance criteria satisfied:
- Project setup: React 18 + TypeScript (strict) + Vite + Vitest + ESLint/Prettier + Docker
- MSAL auth with PKCE + sessionStorage + protected routes + Bearer tokens
- Landing page (public) with dark/light mode
- Name entry with debounced availability check + token initialization fix
- Dashboard with active users (WebSocket-driven) + game count + leaderboards + post-game celebration
- Game screens (gathering, categories, role assignment, gameplay, round end, game end)
- WebSocket with auto-reconnect + exponential backoff + ticket auth
- Typed API client with Bearer token interceptor
- Security: CSP, X-Frame-Options, text-only rendering, strict validation
- CI/CD: GitHub Actions workflows with OIDC auth
- Tests: 46 unit tests (auth flows, game state, components, error handling)

All validation commands pass:
✓ npm run lint (0 errors, 0 warnings)
✓ npm test (46/46 tests passing)
✓ npm run build (success, 494KB JS, 141KB gzipped)
