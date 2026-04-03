#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/release/common.sh
source "${SCRIPT_DIR}/common.sh"

require_gh_auth
configure_git
ensure_release_labels

active_pr="$(get_active_release_pr)"

if [ -z "${active_pr}" ]; then
  echo "No active release PR found."
  exit 1
fi

release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"
release_branch="$(printf '%s' "${active_pr}" | jq -r '.headRefName')"

git fetch origin "${release_branch}" --prune
queued_pr_numbers="$(list_current_release_branch_pr_numbers "${release_branch}" || true)"

sync_release_pr_body "${release_number}" "${release_branch}"
gh pr merge "${release_number}" --merge --delete-branch

if [ -n "${queued_pr_numbers}" ]; then
  while IFS= read -r pr_number; do
    [ -n "${pr_number}" ] || continue
    mark_pr_released "${pr_number}"
    gh pr comment "${pr_number}" --body "Released via release PR #${release_number}."
  done <<< "${queued_pr_numbers}"
fi

echo "Promoted release PR #${release_number} from ${release_branch} into ${RELEASE_TARGET_BRANCH}."
