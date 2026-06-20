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

## Deployment (local azd — no GitHub Actions)

- Deployment is performed locally with the **Azure Developer CLI (`azd`)** from the harness repo
  (`word-game-harness`). There are **no GitHub Actions pipelines, self-hosted runners, or OIDC
  deployment secrets** in this repo — do not add them.
- Local validation order is fail-fast: `lint -> security-scan -> test -> build`.
- Before any deploy, the orchestrator runs `scripts/predeploy-gate.sh` to commit, push, and
  version-tag every repo. Never deploy uncommitted/unpushed code.
- Container images are built and pushed by `azd` / `bash scripts/azd-deploy.sh web` (Azure CLI
  `az login`, not OIDC federation).

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
