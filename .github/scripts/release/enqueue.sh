#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/release/common.sh
source "${SCRIPT_DIR}/common.sh"

: "${PR_NUMBER:?PR_NUMBER is required}"

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

if [ -z "${merge_sha}" ]; then
  echo "PR #${PR_NUMBER} has no merge commit SHA. Manual intervention is required."
  exit 1
fi

if pr_has_label "${PR_NUMBER}" "${RELEASE_HOLD_LABEL}" && [ "${FORCE_ENQUEUE:-false}" != "true" ]; then
  echo "PR #${PR_NUMBER} is on hold. Skipping auto-enqueue."
  exit 0
fi

active_pr="$(ensure_active_release_pr)"
release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"
release_branch="$(printf '%s' "${active_pr}" | jq -r '.headRefName')"

git fetch origin "${release_branch}" --prune

if git log "origin/${release_branch}" --grep="Release-Queue-PR: ${PR_NUMBER}" --format='%H' -n 1 | grep -q .; then
  echo "PR #${PR_NUMBER} is already queued."
  add_label_if_missing "${PR_NUMBER}" "${RELEASE_QUEUE_LABEL}"
  remove_label_if_present "${PR_NUMBER}" "${RELEASE_EXCLUDED_LABEL}"
  sync_release_pr_body "${release_number}" "${release_branch}"
  exit 0
fi

git checkout -B "${release_branch}" "origin/${release_branch}"

parent_count="$(git cat-file -p "${merge_sha}" | grep -c '^parent ' || true)"

if [ "${parent_count}" -gt 1 ]; then
  git cherry-pick -m 1 -x "${merge_sha}"
else
  git cherry-pick -x "${merge_sha}"
fi

latest_message="$(git log -1 --pretty=%B)"
git commit --amend -m "${latest_message}

Release-Queue-PR: ${PR_NUMBER}
Release-Source-PR: $(printf '%s' "${pr_json}" | jq -r '.url')"

git push origin "HEAD:${release_branch}"

add_label_if_missing "${PR_NUMBER}" "${RELEASE_QUEUE_LABEL}"
remove_label_if_present "${PR_NUMBER}" "${RELEASE_EXCLUDED_LABEL}"
sync_release_pr_body "${release_number}" "${release_branch}"
gh pr comment "${PR_NUMBER}" --body "Queued into release PR #${release_number} on branch \`${release_branch}\`."
