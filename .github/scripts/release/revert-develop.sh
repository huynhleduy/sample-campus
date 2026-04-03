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
merge_sha="$(printf '%s' "${pr_json}" | jq -r '.mergeCommit.oid // empty')"

if [ "${base_ref}" != "${RELEASE_SOURCE_BRANCH}" ]; then
  echo "PR #${PR_NUMBER} targets ${base_ref}, not ${RELEASE_SOURCE_BRANCH}."
  exit 1
fi

if [ -z "${merged_at}" ] || [ -z "${merge_sha}" ]; then
  echo "PR #${PR_NUMBER} must be merged and have a merge commit before revert."
  exit 1
fi

branch_name="revert/pr-${PR_NUMBER}-$(date +%s)"
title="Revert #${PR_NUMBER}: $(printf '%s' "${pr_json}" | jq -r '.title')"
body_file="$(mktemp)"

cat > "${body_file}" <<EOF
## Revert Request

This PR reverts #${PR_NUMBER} from \`${RELEASE_SOURCE_BRANCH}\`.

- Original PR: $(printf '%s' "${pr_json}" | jq -r '.url')
- Generated at: $(release_now)

If #${PR_NUMBER} was queued for release, it will also be removed from the active release branch.
EOF

git fetch origin "${RELEASE_SOURCE_BRANCH}" --prune
git checkout -B "${branch_name}" "origin/${RELEASE_SOURCE_BRANCH}"

parent_count="$(git cat-file -p "${merge_sha}" | grep -c '^parent ' || true)"

if [ "${parent_count}" -gt 1 ]; then
  git revert -m 1 --no-edit "${merge_sha}"
else
  git revert --no-edit "${merge_sha}"
fi

git push --set-upstream origin "${branch_name}"

revert_pr_url="$(gh pr create \
  --base "${RELEASE_SOURCE_BRANCH}" \
  --head "${branch_name}" \
  --title "${title}" \
  --body-file "${body_file}")"
rm -f "${body_file}"

add_label_if_missing "${PR_NUMBER}" "${RELEASE_REVERTED_LABEL}"
dequeue_pr_from_active_release "${PR_NUMBER}" "Removed from the active release queue because a revert PR has been opened for \`${RELEASE_SOURCE_BRANCH}\`."

echo "revert_pr_url=${revert_pr_url}" >> "${GITHUB_OUTPUT:-/dev/null}"
