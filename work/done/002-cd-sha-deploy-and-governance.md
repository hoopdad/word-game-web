# Work Request: CD SHA-Named Deploy, Copilot Instructions, CI Fixes

**Requirement:** `.requirements/deployment-updates.yml`
**Contradictions:** `.requirements/contradictions-report.md`
**CI/CD Analysis:** `.requirements/cicd-dependency-analysis.md`
**Platform Guardrails:** `.requirements/platform-guardrails.yml`

## Context

The web frontend needs its CD workflow updated to use the new SHA-named Container App deployment pattern. CI also needs fixes for consistency (fail-fast ordering, security scan). Missing governance files need to be added.

## Acceptance Criteria

### 1. Update CI Workflow (`.github/workflows/ci.yml`)

Fix the contradictions identified in the report:
- Add `needs:` ordering to enforce fail-fast: `lint` → `security-scan` → `test` → `build`
- Add a `security-scan` job:
  - Run `npx eslint --plugin security .` or equivalent
  - Run `npx semgrep --config auto --exclude node_modules --exclude dist` (if semgrep is available, otherwise skip gracefully)
- Remove `develop` from branch triggers (trunk-based development: main only)
- Ensure all jobs use `runs-on: self-hosted`
- Use consistent Node.js 20 setup

### 2. Update CD Workflow (`.github/workflows/cd.yml`)

Replace the current in-place `az containerapp update` with the new SHA-named pattern:

```yaml
# The pattern:
# 1. Build and push image with :sha and :latest
# 2. Create NEW container app with SHA in name
# 3. Wait for health
# 4. Delete old container app(s) in parallel
```

Specific requirements:
- **Trigger:** `workflow_run` after CI on main, gated on success
- **Concurrency:** Add `concurrency: { group: deploy-web-${{ github.ref }}, cancel-in-progress: false }` to prevent race conditions between simultaneous deploys
- **Runner:** `self-hosted`
- **Auth:** OIDC using `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- **Checkout:** Use `github.event.workflow_run.head_sha` (not `github.sha`)
- **Image build/push:**
  - Build: `docker build -t wordgamedevacr.azurecr.io/word-game-web:$SHA .`
  - Also tag as `:latest`
  - Push both tags
  - Use `az acr login --name ${{ secrets.ACR_NAME }}`
- **Container App creation:**
  - Base name: `wordgame-web` (consistent root)
  - SHA suffix: first 7 chars of commit SHA
  - Full name: `wordgame-web-v${SHA7}`
  - Use `az containerapp create` with:
    - `--name wordgame-web-v${SHA7}`
    - `--resource-group ${{ secrets.RESOURCE_GROUP }}`
    - `--environment` (the Container App Environment name from infra, use secret `CONTAINER_APP_ENV`)
    - `--image wordgamedevacr.azurecr.io/word-game-web:${SHA}`
    - `--ingress internal --target-port 8080` (internal only — WAF is the sole public entry point; port 8080 matches nginx container config)
    - `--min-replicas 0 --max-replicas 3`
    - `--user-assigned` managed identity (use secret `MANAGED_IDENTITY_ID`)
    - `--registry-server wordgamedevacr.azurecr.io --registry-identity ${{ secrets.MANAGED_IDENTITY_ID }}`
  - Use the `azure/container-apps-deploy-action` GitHub Action if it supports create (check availability)
- **Health check:** Wait for the new app to be running (`az containerapp show --query properties.runningStatus`)
- **FQDN output:** After creation, capture the new app's FQDN:
  ```bash
  NEW_FQDN=$(az containerapp show -n wordgame-web-v${SHA7} -g $RG --query properties.configuration.ingress.fqdn -o tsv)
  echo "NEW_WEB_FQDN=$NEW_FQDN" >> $GITHUB_OUTPUT
  ```
  Store in Key Vault for WAF consumption:
  ```bash
  az keyvault secret set --vault-name wordgame-dev-kv --name web-active-fqdn --value "$NEW_FQDN"
  ```
- **Cleanup:** Delete old apps only AFTER health check passes. Use `xargs -r` and `set -euo pipefail`:
  ```bash
  set -euo pipefail
  OLD_APPS=$(az containerapp list -g $RG --query "[?starts_with(name, 'wordgame-web-v') && name != 'wordgame-web-v${SHA7}'].name" -o tsv)
  if [ -n "$OLD_APPS" ]; then
    echo "$OLD_APPS" | xargs -I {} az containerapp delete -g $RG -n {} --yes
  fi
  ```
- **Standardized secrets used:**
  - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
  - `ACR_NAME`, `ACR_LOGIN_SERVER`
  - `RESOURCE_GROUP`
  - `CONTAINER_APP_ENV`
  - `MANAGED_IDENTITY_ID`

### 3. Create `.github/copilot-instructions.md`

Include:
- Repo purpose: React/TypeScript SPA with MSAL auth for the word game frontend
- Stack: TypeScript / React 18 / Vite / Vitest / Playwright
- Reference agent files under `.github/agents/`
- Reference platform guardrails in harness repo
- Validation commands: `npm run lint`, `npm test`, `npm run build`
- MSAL auth with PKCE flow, sessionStorage for token cache
- ESLint + Prettier + eslint-plugin-security
- Multi-stage Dockerfile, run as non-root
- MCP tools available: lint-local, security-scanner, usage-tracker

### 4. Update Agent Instructions

#### 4a. Update specialist agent
- Add build validation: Docker build should be included as a validation step (not just `npm run build`)
- Ensure it references self-hosted runners requirement
- Add reference to consistent secret names
- Add reference to the SHA-named deploy pattern

#### 4b. Update critic agent
- Add check for self-hosted runners in workflows
- Add check for security scan in CI
- Add check for `needs:` ordering in CI
- Add check for SHA-named deploy pattern in CD

### 5. Add Additional Secrets

The following additional secrets need to be referenced (they have been set via `gh secret set`):
- `CONTAINER_APP_ENV` — the Container App Environment name
- `MANAGED_IDENTITY_ID` — the user-assigned managed identity resource ID

## Pattern Constraints (binding)
- React 18 with TypeScript (strict mode)
- Vite for build, Vitest for unit tests, Playwright for e2e
- MSAL.js (@azure/msal-browser) with PKCE flow
- sessionStorage for token cache (not localStorage)
- ESLint + Prettier + eslint-plugin-security
- Multi-stage Dockerfile, run as non-root
- GitHub Actions on self-hosted runners only
- OIDC federation for Azure auth
- CI: lint → security scan → test → build (fail fast)
- Container images tagged with :sha and :latest

## Specialist Implementation Summary

- Updated `.github/workflows/ci.yml`:
  - Removed `develop` branch triggers; main only for push/PR.
  - Enforced fail-fast ordering with `needs`: `lint -> security-scan -> test -> build`.
  - Added dedicated `security-scan` job with `npx eslint --plugin security . --max-warnings 0`.
  - Added semgrep step that runs when available and skips cleanly when unavailable.
  - Standardized all jobs to `runs-on: self-hosted` with Node.js 20 setup.
- Updated `.github/workflows/cd.yml` to SHA-named deployment flow:
  - Uses `workflow_run` on CI/main success, with deployment concurrency guard.
  - Checks out `github.event.workflow_run.head_sha`.
  - Builds/pushes image tags `:sha` and `:latest` using `ACR_NAME` + `ACR_LOGIN_SERVER`.
  - Creates new app `wordgame-web-v<sha7>` via `az containerapp create` with required ingress/port/scale/identity/registry settings.
  - Waits for running health status before cleanup.
  - Captures new FQDN as `NEW_WEB_FQDN`, writes it to `GITHUB_OUTPUT`, and stores it in Key Vault (`web-active-fqdn`).
  - Deletes old `wordgame-web-v*` apps in parallel using `xargs -r -P`.
- Added `.github/copilot-instructions.md` with stack, auth/security, CI/CD expectations, validation commands, agent references, guardrails pointer, and MCP tool availability.
- Updated `.github/agents/word-game-web-specialist.agent.md`:
  - Added Docker build to validation requirements.
  - Added self-hosted runner requirement, standardized secret names, and SHA-named deploy pattern references.
- Updated `.github/agents/word-game-web-critic.agent.md`:
  - Added explicit checks for self-hosted runners, CI security scan, CI `needs` ordering, and SHA-named CD pattern.
- Fixed Dockerfile user/group creation step to be idempotent so Docker build validation succeeds on nginx images that already include `nginx` user/group.

## Critic PASS Rationale

PASS. The request satisfies the acceptance criteria and platform constraints:

- CI now runs on main only, all jobs use `runs-on: self-hosted`, includes explicit `security-scan`, and enforces `lint -> security-scan -> test -> build` via `needs`.
- CD now uses workflow_run success gating from CI on main, includes the required concurrency guard, checks out `head_sha`, uses OIDC auth secrets, builds/pushes `:sha` + `:latest`, creates SHA-named apps (`wordgame-web-v<sha7>`), performs health gating, publishes FQDN and Key Vault secret, and cleans up old SHA-named apps after successful health in parallel.
- Governance updates were added: `.github/copilot-instructions.md`, specialist instructions, and critic checks aligned to self-hosted + security scan + needs ordering + SHA deployment pattern.
- Additional secrets are now referenced in CD (`CONTAINER_APP_ENV`, `MANAGED_IDENTITY_ID`) alongside the standardized secret set.
