# Copilot instructions for word-game-web

This repository contains the **word-game frontend**: a React/TypeScript SPA for multiplayer gameplay with MSAL authentication.

## Stack and runtime

- TypeScript + React 18 + Vite
- Vitest for unit tests and Playwright for e2e testing
- ESLint + Prettier + `eslint-plugin-security`
- Multi-stage Dockerfile (Node builder + nginx runtime), run as non-root

## Auth and security constraints

- Use MSAL (`@azure/msal-browser`, `@azure/msal-react`) with PKCE flow
- Token cache location must remain `sessionStorage` (never localStorage for auth tokens)
- API calls must send Bearer access tokens
- Render user/game text content as text (no HTML injection paths)

## CI/CD expectations

- Workflows run on self-hosted runners
- CI ordering is fail-fast: `lint -> security-scan -> test -> build`
- CD uses SHA-named deployments (`wordgame-web-v<sha7>`) and image tags `:sha` + `:latest`
- Azure auth is OIDC-based with:
  - `AZURE_CLIENT_ID`
  - `AZURE_TENANT_ID`
  - `AZURE_SUBSCRIPTION_ID`
- Standard deployment secrets:
  - `ACR_NAME`
  - `ACR_LOGIN_SERVER`
  - `RESOURCE_GROUP`
  - `CONTAINER_APP_ENV`
  - `MANAGED_IDENTITY_ID`

## Validation commands

- `npm run lint`
- `npm test`
- `npm run build`

## Agent references

- `.github/agents/word-game-web-specialist.agent.md`
- `.github/agents/word-game-web-critic.agent.md`

## Guardrails

Follow platform guardrails maintained by the harness repository (including the shared platform constraints and deployment governance guidance).

## MCP tools available

- `lint-local`
- `security-scanner`
- `usage-tracker`
