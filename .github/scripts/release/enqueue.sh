#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/release/common.sh
source "${SCRIPT_DIR}/common.sh"

: "${PR_NUMBER:?PR_NUMBER is required}"

cleanup_cherry_pick() {
  if git rev-parse -q --verify CHERRY_PICK_HEAD >/dev/null 2>&1; then
    git cherry-pick --abort || true
  fi
}

trap cleanup_cherry_pick EXIT

cherry_pick_or_fail() {
  local commit_sha="$1"
  local extra_args=("${@:2}")

  if git cherry-pick "${extra_args[@]}" -x "${commit_sha}"; then
    return 0
  fi

  cleanup_cherry_pick

  echo "Failed to enqueue PR #${PR_NUMBER} onto ${release_branch}: cherry-pick conflict at commit ${commit_sha}." >&2
  echo "This usually means the PR depends on earlier changes from ${RELEASE_SOURCE_BRANCH} that are not queued on ${release_branch} yet." >&2
  echo "Queue the missing earlier PR(s) first, then rerun Release Enqueue for PR #${PR_NUMBER}." >&2
  exit 1
}

require_gh_auth
configure_git
ensure_release_labels

pr_json="$(gh pr view "${PR_NUMBER}" --json number,title,url,baseRefName,mergeCommit,mergedAt,labels)"
base_ref="$(printf '%s' "${pr_json}" | jq -r '.baseRefName')"
merged_at="$(printf '%s' "${pr_json}" | jq -r '.mergedAt // empty')"
merge_sha="${PR_MERGE_SHA:-$(printf '%s' "${pr_json}" | jq -r '.mergeCommit.oid // empty')}"

if [ "${base_ref}" != "${RELEASE_SOURCE_BRANCH}" ]; then
  echo "PR #${PR_NUMBER} targets ${base_ref}, not ${RELEASE_SOURCE_BRANCH}. Skipping."
  exit 0
fi

if [ -z "${merged_at}" ]; then
  echo "PR #${PR_NUMBER} is not merged. Skipping."
  exit 0
fi

if pr_has_label "${PR_NUMBER}" "${RELEASE_HOLD_LABEL}" && [ "${FORCE_ENQUEUE:-false}" != "true" ]; then
  echo "PR #${PR_NUMBER} is on hold. Skipping auto-enqueue."
  exit 0
fi

release_branch="$(resolve_release_branch_name)"

if remote_release_branch_exists "${release_branch}"; then
  git fetch origin "${release_branch}" --prune
fi

if remote_release_branch_exists "${release_branch}" \
  && git log "origin/${release_branch}" --grep="Release-Queue-PR: ${PR_NUMBER}" --format='%H' -n 1 | grep -q .; then
  echo "PR #${PR_NUMBER} is already queued."
  active_pr="$(ensure_active_release_pr_for_branch "${release_branch}")"
  release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"
  add_label_if_missing "${PR_NUMBER}" "${RELEASE_QUEUE_LABEL}"
  remove_label_if_present "${PR_NUMBER}" "${RELEASE_EXCLUDED_LABEL}"
  sync_release_pr_body "${release_number}" "${release_branch}"
  exit 0
fi

# The release queue is FIFO by merge order. This intentionally prefers
# deterministic release branches over opportunistic out-of-order cherry-picks.
blocking_prs="$(list_blocking_merged_prs_before_pr "${release_branch}" "${PR_NUMBER}" "${merged_at}")"

if [ -n "${blocking_prs}" ]; then
  first_blocker="$(printf '%s\n' "${blocking_prs}" | head -n 1)"
  first_blocker_number="$(printf '%s' "${first_blocker}" | cut -f1)"
  first_blocker_title="$(printf '%s' "${first_blocker}" | cut -f2-)"
  blocker_numbers="$(printf '%s\n' "${blocking_prs}" | cut -f1 | paste -sd ',' - | sed 's/,/, /g')"
  blocker_summary="#${first_blocker_number} ${first_blocker_title}"

  echo "PR #${PR_NUMBER} cannot be enqueued onto ${release_branch} yet." >&2
  echo "Earlier merged PRs are still missing from the release branch: ${blocker_numbers}" >&2
  echo "Queue the earliest missing PR first: ${blocker_summary}" >&2
  exit 1
fi

release_branch="$(ensure_active_release_branch)"
git fetch origin "${release_branch}" --prune

git checkout -B "${release_branch}" "origin/${release_branch}"

if [ -n "${merge_sha}" ]; then
  parent_count="$(git cat-file -p "${merge_sha}" | grep -c '^parent ' || true)"

  if [ "${parent_count}" -gt 1 ]; then
    cherry_pick_or_fail "${merge_sha}" -m 1
  else
    cherry_pick_or_fail "${merge_sha}"
  fi
else
  while IFS= read -r commit_sha; do
    [ -n "${commit_sha}" ] || continue
    cherry_pick_or_fail "${commit_sha}"
  done <<< "$(list_pr_commit_shas "${PR_NUMBER}")"
fi

latest_message="$(git log -1 --pretty=%B)"
git commit --amend -m "${latest_message}

Release-Queue-PR: ${PR_NUMBER}
Release-Source-PR: $(printf '%s' "${pr_json}" | jq -r '.url')"

git push origin "HEAD:${release_branch}"

active_pr="$(ensure_active_release_pr_for_branch "${release_branch}")"
release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"

add_label_if_missing "${PR_NUMBER}" "${RELEASE_QUEUE_LABEL}"
remove_label_if_present "${PR_NUMBER}" "${RELEASE_EXCLUDED_LABEL}"
sync_release_pr_body "${release_number}" "${release_branch}"
gh pr comment "${PR_NUMBER}" --body "Queued into release PR #${release_number} on branch \`${release_branch}\`."
