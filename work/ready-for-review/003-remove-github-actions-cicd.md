# Work Request: Remove GitHub Actions CI/CD Vestiges

**Requirement:** `/home/mike/source/word-game/word-game-harness/.requirements/cicd.yml`
**Platform Guardrails:** `/home/mike/source/word-game/word-game-harness/.requirements/platform-guardrails.yml`

## Context

The project is moving from GitHub Actions CI/CD to local `azd up` orchestration from `word-game-harness`. Remove only the GitHub Actions workflow vestiges from this repo. Do not change application code.

## Acceptance Criteria

1. Delete these files if they exist:
   - `.github/workflows/ci.yml`
   - `.github/workflows/cd.yml`
2. Do not add replacement workflows.
3. Do not modify runtime application code.
4. Commit the repo changes on `feature/azd-deploy` with exactly:

```text
refactor: remove GitHub Actions CI/CD in favor of local azd deploy

Removes workflow files and OIDC federation. Deployment now handled by
azd up from word-game-harness with local terraform state.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

## Validation

- Verify both workflow files are absent.
- Ensure `git status --short` is clean after the commit.

## Critic Gate

Return `STATUS: PASS` only if the workflow files are removed, no app code changed, and the required commit exists.

## Specialist Implementation Summary

- Removed `.github/workflows/ci.yml` and `.github/workflows/cd.yml`.
- Did not add replacement workflows and did not modify runtime application code.
- Request moved to `work/ready-for-review/` for critic verification.
