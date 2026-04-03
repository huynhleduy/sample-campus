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

pr_json_has_label() {
  local pr_json="$1"
  local label="$2"

  printf '%s' "${pr_json}" | jq -e --arg label "${label}" 'any(.labels[].name?; . == $label)' >/dev/null
}

pr_is_queued_on_ref() {
  local ref_name="$1"
  local pr_number="$2"

  git log "${ref_name}" --grep="Release-Queue-PR: ${pr_number}" --format='%H' -n 1 | grep -q .
}

cherry_pick_or_fail() {
  local queued_pr_number="$1"
  local commit_sha="$2"
  local extra_args=("${@:3}")

  if git cherry-pick "${extra_args[@]}" -x "${commit_sha}"; then
    return 0
  fi

  cleanup_cherry_pick

  echo "Failed to enqueue PR #${queued_pr_number} onto ${release_branch}: cherry-pick conflict at commit ${commit_sha}." >&2
  echo "This usually means the PR depends on earlier changes from ${RELEASE_SOURCE_BRANCH} that are not queued on ${release_branch} yet." >&2
  echo "Resolve the conflict on ${release_branch}, or dequeue the dependent PRs and retry." >&2
  exit 1
}

enqueue_single_pr() {
  local queued_pr_number="$1"
  local queued_pr_json base_ref merged_at merge_sha latest_message parent_count
  local queued_pr_title queued_pr_url

  queued_pr_json="$(gh pr view "${queued_pr_number}" --json number,title,url,baseRefName,mergeCommit,mergedAt,labels)"
  queued_pr_title="$(printf '%s' "${queued_pr_json}" | jq -r '.title')"
  queued_pr_url="$(printf '%s' "${queued_pr_json}" | jq -r '.url')"
  base_ref="$(printf '%s' "${queued_pr_json}" | jq -r '.baseRefName')"
  merged_at="$(printf '%s' "${queued_pr_json}" | jq -r '.mergedAt // empty')"
  merge_sha="${PR_MERGE_SHA:-$(printf '%s' "${queued_pr_json}" | jq -r '.mergeCommit.oid // empty')}"

  if [ "${queued_pr_number}" != "${PR_NUMBER}" ]; then
    merge_sha="$(printf '%s' "${queued_pr_json}" | jq -r '.mergeCommit.oid // empty')"
  fi

  if [ "${base_ref}" != "${RELEASE_SOURCE_BRANCH}" ]; then
    echo "PR #${queued_pr_number} targets ${base_ref}, not ${RELEASE_SOURCE_BRANCH}. Cannot enqueue it." >&2
    exit 1
  fi

  if [ -z "${merged_at}" ]; then
    echo "PR #${queued_pr_number} is not merged. Cannot enqueue it." >&2
    exit 1
  fi

  if pr_json_has_label "${queued_pr_json}" "${RELEASE_HOLD_LABEL}" && [ "${FORCE_ENQUEUE:-false}" != "true" ]; then
    echo "Stopped before PR #${PR_NUMBER}: earlier PR #${queued_pr_number} is on hold." >&2
    echo "Remove ${RELEASE_HOLD_LABEL}, or rerun with force enabled if that is intentional." >&2
    exit 1
  fi

  if pr_is_queued_on_ref HEAD "${queued_pr_number}"; then
    add_label_if_missing "${queued_pr_number}" "${RELEASE_QUEUE_LABEL}"
    remove_label_if_present "${queued_pr_number}" "${RELEASE_EXCLUDED_LABEL}"
    return 0
  fi

  echo "Queueing PR #${queued_pr_number} onto ${release_branch}: ${queued_pr_title}"

  if [ -n "${merge_sha}" ]; then
    parent_count="$(git cat-file -p "${merge_sha}" | grep -c '^parent ' || true)"

    if [ "${parent_count}" -gt 1 ]; then
      cherry_pick_or_fail "${queued_pr_number}" "${merge_sha}" -m 1
    else
      cherry_pick_or_fail "${queued_pr_number}" "${merge_sha}"
    fi
  else
    while IFS= read -r commit_sha; do
      [ -n "${commit_sha}" ] || continue
      cherry_pick_or_fail "${queued_pr_number}" "${commit_sha}"
    done <<< "$(list_pr_commit_shas "${queued_pr_number}")"
  fi

  latest_message="$(git log -1 --pretty=%B)"
  git commit --amend -m "${latest_message}

Release-Queue-PR: ${queued_pr_number}
Release-Source-PR: ${queued_pr_url}"

  add_label_if_missing "${queued_pr_number}" "${RELEASE_QUEUE_LABEL}"
  remove_label_if_present "${queued_pr_number}" "${RELEASE_EXCLUDED_LABEL}"

  if [ "${queued_pr_number}" != "${PR_NUMBER}" ]; then
    auto_enqueued_prs+=("#${queued_pr_number} ${queued_pr_title}")
  fi
}

require_gh_auth
configure_git
ensure_release_labels

pr_json="$(gh pr view "${PR_NUMBER}" --json number,title,url,baseRefName,mergeCommit,mergedAt,labels)"
base_ref="$(printf '%s' "${pr_json}" | jq -r '.baseRefName')"
merged_at="$(printf '%s' "${pr_json}" | jq -r '.mergedAt // empty')"

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

if remote_release_branch_exists "${release_branch}" && pr_is_queued_on_ref "origin/${release_branch}" "${PR_NUMBER}"; then
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

declare -a blocker_pr_numbers=()
declare -a auto_enqueued_prs=()

if [ -n "${blocking_prs}" ]; then
  blocker_numbers="$(printf '%s\n' "${blocking_prs}" | cut -f1 | paste -sd ',' - | sed 's/,/, /g')"
  echo "Earlier merged PRs are missing from ${release_branch}. Queueing them first: ${blocker_numbers}"

  while IFS=$'\t' read -r blocker_number _; do
    [ -n "${blocker_number}" ] || continue
    blocker_pr_numbers+=("${blocker_number}")
  done <<< "${blocking_prs}"
fi

release_branch="$(ensure_active_release_branch)"
git fetch origin "${release_branch}" --prune

git checkout -B "${release_branch}" "origin/${release_branch}"

for queued_pr_number in "${blocker_pr_numbers[@]}"; do
  enqueue_single_pr "${queued_pr_number}"
done

if [ "${#blocker_pr_numbers[@]}" -gt 0 ]; then
  git push origin "HEAD:${release_branch}"

  active_pr="$(ensure_active_release_pr_for_branch "${release_branch}")"
  release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"
  sync_release_pr_body "${release_number}" "${release_branch}"
fi

enqueue_single_pr "${PR_NUMBER}"

git push origin "HEAD:${release_branch}"

active_pr="$(ensure_active_release_pr_for_branch "${release_branch}")"
release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"

sync_release_pr_body "${release_number}" "${release_branch}"

comment_body="Queued into release PR #${release_number} on branch \`${release_branch}\`."

if [ "${#auto_enqueued_prs[@]}" -gt 0 ]; then
  comment_body="${comment_body}

Also auto-enqueued earlier merged PRs to keep the release queue in order:
$(printf '%s\n' "${auto_enqueued_prs[@]}" | sed 's/^/- /')"
fi

gh pr comment "${PR_NUMBER}" --body "${comment_body}"
