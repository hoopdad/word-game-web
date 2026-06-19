# Work Request: Profile Page + Category Config UX Fix

## Reference
- Requirement: `.requirements/cosmos-persistence.yml` (in word-game-harness)
- Requirement: `.requirements/category-agent.yml` (in word-game-harness)
- Contract: `.contracts/game-api.yml` (in word-game-harness)

## Context

Two frontend issues need fixing:
1. No Profile page exists — users cannot change their display name after registration
2. Category Config page stalls on save and loses data on reload

The API team is fixing the backend simultaneously:
- `PUT /api/users/profile` will be available (same request/response as register)
- `GET /api/categories/config` now returns persisted data from Cosmos DB
- `PUT /api/categories/config` now saves URLs immediately and returns instantly (agent generation is async)

## Acceptance Criteria

### 1. Profile Page (`src/pages/Profile.tsx`)

Create a new page accessible from the Dashboard header:
- Shows current display name
- Allows changing it with same validation rules as NameEntry:
  - 2-20 characters
  - Alphanumeric + spaces only (regex: `^[A-Za-z0-9 ]{2,20}$`)
  - Real-time availability check (debounced, same as NameEntry)
  - Shows ✓/✗ availability indicator
- On submit: calls `PUT /api/users/profile` with `{display_name: "new_name"}`
- On success: updates localStorage displayName, navigates back to dashboard
- On 409: shows "that name is taken"

### 2. API Client Method

Add to `src/services/apiClient.ts`:
```typescript
async updateProfile(displayName: string): Promise<void> {
  await this.client.put('/users/profile', { display_name: displayName })
}
```

### 3. Dashboard Navigation

Add a "Profile" button in the Dashboard header (alongside "Configure Categories" and "Logout"):
```tsx
<button className="nav-button" onClick={() => navigate('/profile')}>
  Profile
</button>
```

### 4. Route Registration

Add route in App.tsx (or wherever routes are defined):
```tsx
<Route path="/profile" element={<Profile />} />
```

### 5. Fix CategoryConfig Page

Current issues:
- `getCategoryConfig()` returns `{urls: string[], ...}` but the page expects `CategoryUrl[]` with `{id, url}` objects
- The page type-casts incorrectly, causing empty list on load

Fix the `fetchCategories` handler:
```typescript
const config = await apiClient.getCategoryConfig()
// Transform string[] to CategoryUrl[] for local state
setCategories((config.urls || []).map((url: string, i: number) => ({
  id: `${i}`,
  url
})))
```

### 6. Fix CategoryConfig Save UX

The backend now returns immediately after saving URLs (agent generation is async).
Update the save handler to:
- Remove the "loading forever" state — save completes in < 2s
- Show a success message: "Categories saved! Generation in progress..."
- Navigate back to dashboard after short delay (or immediately)

Optionally increase the axios timeout for this specific call if needed:
```typescript
async updateCategoryConfig(config: { urls: string[] }): Promise<void> {
  await this.client.put('/categories/config', config)
  // No longer blocks on agent generation
}
```

### 7. Fix Axios Timeout

The default axios timeout is 10000ms (10s). Since saves now return immediately,
this is fine. But verify the GET call for loading categories doesn't time out
(it shouldn't since it's just reading from Cosmos).

## File Locations (from topology.md)

| File | Purpose |
|------|---------|
| src/pages/Profile.tsx | NEW — profile page |
| src/pages/Profile.css | NEW — profile styles |
| src/pages/CategoryConfig.tsx | FIX — loading and save |
| src/services/apiClient.ts | ADD — updateProfile method |
| src/App.tsx | ADD — /profile route |
| src/pages/Dashboard.tsx | ADD — Profile button |

## Validation Commands

```bash
npm run lint
npm run test
npm run build
```

## Platform Constraints
- TypeScript / React 18 / Vite
- Follow existing patterns (see NameEntry.tsx for form patterns, Dashboard.tsx for layout)
- Use existing hooks: `useAuth`, `useDebounce`
- API field names must be snake_case in request bodies (e.g., `display_name` not `displayName`)

## Critic Feedback

STATUS: FAIL

Validation results:
- `npm run lint`, `npm test`, and `npm run build` all passed.
- MSAL hard gates passed (`redirectUri` uses `window.location.origin`, token fallback uses `acquireTokenPopup`, Dockerfile `ARG VITE_MSAL_*` appears before build).
- Profile page, route wiring, dashboard nav button, and category config data/save UX fixes are implemented.

Blocking issue:
- Contract alignment check failed on API base URL behavior. In `src/services/apiClient.ts`, the client is created with:
  - `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'`
  - Checklist requires a relative `/api` base URL for frontend API calls.

Required fix before PASS:
- Update API client base URL default/fallback to relative `/api` (and keep request paths contract-aligned).

## Critic Re-Review — PASS

Fixed: API client base URL changed from `http://localhost:5000/api` to relative `/api`.
Validation: lint ✅, tests (75 passed) ✅, build ✅.
All acceptance criteria met. Moving to done.

STATUS: PASS
