# GitHub Automation Layout

This repo keeps GitHub automation split by responsibility so `sample-campus` can evolve without rewriting pipelines.

## Workflows

- `workflows/auto-author-assign.yml`
  Assigns the PR author automatically.
- `workflows/merge-conflict.yml`
  Maintains the merge-conflict label.
- `workflows/sample-campus-ci.yml`
  Runs `sample-campus` verification, tests, and a Docker smoke build.
- `workflows/sample-campus-deploy.yml`
  Manually builds and optionally publishes the `sample-campus` image, then delegates deployment to an adapter script.
- `workflows/sample-campus-rollback.yml`
  Manually rolls an environment back to a previous image or deployment version through a rollback adapter.
- `workflows/release-create.yml`
  Opens the active release branch and release PR.
- `workflows/release-enqueue.yml`
  Queues a merged PR from `develop` into the active release branch.
- `workflows/release-dequeue.yml`
  Removes a PR from the active release branch without rewriting `develop`.
- `workflows/release-revert-develop.yml`
  Creates a revert PR against `develop` and removes the change from the active release branch if needed.
- `workflows/release-promote.yml`
  Promotes the active release PR into the target branch and marks queued PRs as released.
- `workflows/release-sync.yml`
  Rebuilds the release PR body from queue labels.
- `workflows/release-backmerge.yml`
  Opens or refreshes a backmerge PR from the shipped branch into `develop`.

## Policy Files

- `CODEOWNERS`
  Review ownership map. Replace placeholder owners before enforcing code-owner review in branch protection.
- `PULL_REQUEST_TEMPLATE.md`
  PR checklist for validation, release impact, migrations, and rollback expectations.

## Composite Actions

- `actions/setup-sample-campus`
  Node and dependency setup for `sample-campus`.
- `actions/verify-sample-campus`
  Static checks only.
- `actions/test-sample-campus`
  Jest execution against an injected PostgreSQL service.
- `actions/build-sample-campus-image`
  Build and optional publish for the application image.
- `actions/run-deploy-adapter`
  Stable hand-off point for infrastructure-specific delivery logic.
- `actions/run-rollback-adapter`
  Stable hand-off point for infrastructure-specific rollback logic.

## Extension Points

- Keep CI workflow structure stable and evolve only the composite actions when build or test commands change.
- Keep deploy workflow structure stable and replace `.github/scripts/deploy-sample-campus.sh` when infrastructure changes.
- Keep rollback workflow structure stable and replace `.github/scripts/rollback-sample-campus.sh` when infrastructure changes.
- Release queue logic lives in `.github/scripts/release/`. Keep GitHub API and git mutation logic there, not in workflow YAML.
- If more apps are added later, follow the same pattern instead of extending `sample-campus` workflows into a monolith.
