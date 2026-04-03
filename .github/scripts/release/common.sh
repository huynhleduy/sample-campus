#!/usr/bin/env bash

set -euo pipefail

RELEASE_SOURCE_BRANCH="${RELEASE_SOURCE_BRANCH:-develop}"
RELEASE_TARGET_BRANCH="${RELEASE_TARGET_BRANCH:-main}"
RELEASE_BRANCH_PREFIX="${RELEASE_BRANCH_PREFIX:-release}"
RELEASE_TIMEZONE="${RELEASE_TIMEZONE:-Asia/Ho_Chi_Minh}"
RELEASE_QUEUE_LABEL="${RELEASE_QUEUE_LABEL:-release:queued}"
RELEASE_EXCLUDED_LABEL="${RELEASE_EXCLUDED_LABEL:-release:excluded}"
RELEASE_HOLD_LABEL="${RELEASE_HOLD_LABEL:-release:hold}"
RELEASE_ACTIVE_LABEL="${RELEASE_ACTIVE_LABEL:-release:active}"
RELEASE_RELEASED_LABEL="${RELEASE_RELEASED_LABEL:-release:released}"
RELEASE_REVERTED_LABEL="${RELEASE_REVERTED_LABEL:-release:reverted}"
RELEASE_HOTFIX_LABEL="${RELEASE_HOTFIX_LABEL:-release:hotfix}"

release_now() {
  TZ="${RELEASE_TIMEZONE}" date '+%Y-%m-%d %H:%M:%S %Z'
}

release_date() {
  TZ="${RELEASE_TIMEZONE}" date '+%Y%m%d'
}

require_gh_auth() {
  : "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
  export GH_TOKEN="${GITHUB_TOKEN}"
}

configure_git() {
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
}

ensure_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label list --limit 100 --json name --jq ".[] | select(.name == \"${name}\") | .name" | grep -q .; then
    return 0
  fi

  gh label create "${name}" --color "${color}" --description "${description}"
}

ensure_release_labels() {
  ensure_label "${RELEASE_QUEUE_LABEL}" "0E8A16" "PR is queued for the active release branch"
  ensure_label "${RELEASE_EXCLUDED_LABEL}" "B60205" "PR is intentionally excluded from the active release branch"
  ensure_label "${RELEASE_HOLD_LABEL}" "FBCA04" "PR should not be auto-queued into the active release branch"
  ensure_label "${RELEASE_ACTIVE_LABEL}" "1D76DB" "The currently active release PR"
  ensure_label "${RELEASE_RELEASED_LABEL}" "5319E7" "PR has been promoted to the target branch"
  ensure_label "${RELEASE_REVERTED_LABEL}" "D93F0B" "PR has a revert PR open or merged on the source branch"
  ensure_label "${RELEASE_HOTFIX_LABEL}" "C2E0C6" "PR is a hotfix candidate for urgent release handling"
}

get_active_release_pr() {
  gh pr list \
    --base "${RELEASE_TARGET_BRANCH}" \
    --state open \
    --json number,title,url,headRefName,baseRefName \
    | jq -c --arg prefix "${RELEASE_BRANCH_PREFIX}/" 'map(select(.headRefName | startswith($prefix))) | first // empty'
}

get_release_sequence() {
  local date="$1"

  gh pr list \
    --base "${RELEASE_TARGET_BRANCH}" \
    --state all \
    --json headRefName \
    | jq -r --arg prefix "${RELEASE_BRANCH_PREFIX}/${date}-" '
        [.[]
          | select(.headRefName | startswith($prefix))
          | (.headRefName | capture("-(?<n>[0-9]+)$").n | tonumber)
        ] | max // 0
      '
}

get_existing_release_branch_for_date() {
  local date="$1"

  git ls-remote --heads origin "refs/heads/${RELEASE_BRANCH_PREFIX}/${date}-*" \
    | sed -n "s#.*refs/heads/\(${RELEASE_BRANCH_PREFIX}/${date}-[0-9][0-9]*\)\$#\1#p" \
    | sort -t- -k2,2n \
    | tail -n 1
}

ensure_active_release_branch() {
  local active_pr date branch_name sequence next_sequence

  active_pr="$(get_active_release_pr)"

  if [ -n "${active_pr}" ]; then
    printf '%s\n' "$(printf '%s' "${active_pr}" | jq -r '.headRefName')"
    return 0
  fi

  date="$(release_date)"
  branch_name="$(get_existing_release_branch_for_date "${date}")"

  if [ -n "${branch_name}" ]; then
    printf '%s\n' "${branch_name}"
    return 0
  fi

  sequence="$(get_release_sequence "${date}")"
  next_sequence="$((sequence + 1))"
  branch_name="${RELEASE_BRANCH_PREFIX}/${date}-${next_sequence}"

  git fetch origin "${RELEASE_TARGET_BRANCH}" --prune >&2
  git checkout -B "${branch_name}" "origin/${RELEASE_TARGET_BRANCH}" >&2
  git push --set-upstream origin "${branch_name}" >&2

  printf '%s\n' "${branch_name}"
}

list_prs_by_label() {
  local label="$1"

  gh pr list \
    --base "${RELEASE_SOURCE_BRANCH}" \
    --state merged \
    --limit 200 \
    --label "${label}" \
    --json number,title,url,mergedAt \
    | jq -r '
        sort_by(.mergedAt)
        | if length == 0 then
            "- None"
          else
            .[] | "- #\(.number) \(.title)"
          end
      '
}

list_merged_source_prs() {
  gh pr list \
    --base "${RELEASE_SOURCE_BRANCH}" \
    --state merged \
    --limit 200 \
    --json number,title,url,mergedAt,labels
}

release_branch_has_diff() {
  local branch_name="$1"

  git fetch origin "${RELEASE_TARGET_BRANCH}" "${branch_name}" --prune
  [ "$(git rev-list --count "origin/${RELEASE_TARGET_BRANCH}..origin/${branch_name}")" -gt 0 ]
}

list_current_release_branch_pr_numbers() {
  local release_branch="$1"

  git log --reverse "origin/${release_branch}" \
    --format='%B%n<<END>>' \
    | awk '
        /^Release-Queue-PR: [0-9]+$/ {
          pr = $2
          queued[pr] = 1
          order[++count] = pr
          next
        }
        /^Release-Queue-Dequeue-PR: [0-9]+$/ {
          delete queued[$2]
          next
        }
        END {
          for (i = 1; i <= count; i++) {
            pr = order[i]
            if (queued[pr] && !printed[pr]++) {
              print pr
            }
          }
        }
      '
}

list_release_branch_pr_entries() {
  local release_branch="$1"
  local pr_numbers pr_number title

  pr_numbers="$(list_current_release_branch_pr_numbers "${release_branch}")"

  if [ -z "${pr_numbers}" ]; then
    echo "- None"
    return 0
  fi

  while IFS= read -r pr_number; do
    [ -n "${pr_number}" ] || continue
    title="$(gh pr view "${pr_number}" --json title --jq '.title')"
    echo "- #${pr_number} ${title}"
  done <<< "${pr_numbers}"
}

list_blocking_merged_prs_before_pr() {
  local release_branch="$1"
  local current_pr_number="$2"
  local queued_pr_numbers merged_prs_json

  queued_pr_numbers="$(list_current_release_branch_pr_numbers "${release_branch}" || true)"
  merged_prs_json="$(list_merged_source_prs)"

  printf '%s' "${merged_prs_json}" | jq -c \
    --argjson current_pr_number "${current_pr_number}" \
    --arg queued_pr_numbers "${queued_pr_numbers}" \
    --arg excluded_label "${RELEASE_EXCLUDED_LABEL}" \
    --arg hold_label "${RELEASE_HOLD_LABEL}" '
      ($queued_pr_numbers | split("\n") | map(select(length > 0) | tonumber)) as $queued
      | sort_by(.mergedAt) as $prs
      | ($prs | map(.number) | index($current_pr_number)) as $current_index
      | if $current_index == null then
          empty
        else
          $prs[:$current_index]
          | map(select(
              (($queued | index(.number)) == null)
              and ((.labels | map(.name) | index($excluded_label)) == null)
              and ((.labels | map(.name) | index($hold_label)) == null)
            ))
          | .[]
        end
    '
}

render_release_body() {
  local branch_name="$1"

  cat <<EOF
## Release Queue

- Source branch: \`${RELEASE_SOURCE_BRANCH}\`
- Target branch: \`${RELEASE_TARGET_BRANCH}\`
- Release branch: \`${branch_name}\`
- Synced at: $(release_now)

### Queued
$(list_release_branch_pr_entries "${branch_name}")

### Hold
$(list_prs_by_label "${RELEASE_HOLD_LABEL}")

### Excluded
$(list_prs_by_label "${RELEASE_EXCLUDED_LABEL}")

<!-- release-queue:managed -->
EOF
}

sync_release_pr_body() {
  local release_pr_number="$1"
  local branch_name="$2"
  local body_file
  body_file="$(mktemp)"

  render_release_body "${branch_name}" > "${body_file}"
  gh pr edit "${release_pr_number}" --body-file "${body_file}"
  rm -f "${body_file}"
}

ensure_active_release_pr_for_branch() {
  local branch_name="$1"
  local active_pr
  active_pr="$(get_active_release_pr)"

  if [ -n "${active_pr}" ]; then
    add_label_if_missing "$(printf '%s' "${active_pr}" | jq -r '.number')" "${RELEASE_ACTIVE_LABEL}"
    printf '%s\n' "${active_pr}"
    return 0
  fi

  if ! release_branch_has_diff "${branch_name}"; then
    return 1
  fi

  local body_file
  body_file="$(mktemp)"
  render_release_body "${branch_name}" > "${body_file}"
  local title pr_url pr_number
  title="Release-$(release_date)_$(printf '%s' "${branch_name}" | awk -F- '{print $NF}')"
  pr_url="$(gh pr create \
    --base "${RELEASE_TARGET_BRANCH}" \
    --head "${branch_name}" \
    --title "${title}" \
    --body-file "${body_file}")"
  rm -f "${body_file}"

  pr_number="$(gh pr view "${pr_url}" --json number --jq '.number')"
  gh pr edit "${pr_number}" --add-label "${RELEASE_ACTIVE_LABEL}"

  gh pr view "${pr_number}" --json number,title,url,headRefName,baseRefName --jq '.'
}

pr_has_label() {
  local pr_number="$1"
  local label="$2"

  gh pr view "${pr_number}" --json labels --jq ".labels[].name" | grep -Fxq "${label}"
}

remove_label_if_present() {
  local pr_number="$1"
  local label="$2"

  if pr_has_label "${pr_number}" "${label}"; then
    gh pr edit "${pr_number}" --remove-label "${label}"
  fi
}

add_label_if_missing() {
  local pr_number="$1"
  local label="$2"

  if ! pr_has_label "${pr_number}" "${label}"; then
    gh pr edit "${pr_number}" --add-label "${label}"
  fi
}

get_release_branch_commit_for_pr() {
  local release_branch="$1"
  local pr_number="$2"

  git log "origin/${release_branch}" \
    --grep="Release-Queue-PR: ${pr_number}" \
    --format='%H' \
    -n 1 \
    || true
}

mark_pr_released() {
  local pr_number="$1"

  remove_label_if_present "${pr_number}" "${RELEASE_QUEUE_LABEL}"
  remove_label_if_present "${pr_number}" "${RELEASE_EXCLUDED_LABEL}"
  remove_label_if_present "${pr_number}" "${RELEASE_HOLD_LABEL}"
  add_label_if_missing "${pr_number}" "${RELEASE_RELEASED_LABEL}"
}

exclude_pr_from_release() {
  local pr_number="$1"

  remove_label_if_present "${pr_number}" "${RELEASE_QUEUE_LABEL}"
  add_label_if_missing "${pr_number}" "${RELEASE_EXCLUDED_LABEL}"
}

dequeue_pr_from_active_release() {
  local pr_number="$1"
  local comment_body="${2:-}"
  local active_pr release_number release_branch queued_commit latest_message

  active_pr="$(get_active_release_pr)"

  if [ -z "${active_pr}" ]; then
    exclude_pr_from_release "${pr_number}"
    return 0
  fi

  release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"
  release_branch="$(printf '%s' "${active_pr}" | jq -r '.headRefName')"

  git fetch origin "${release_branch}" --prune
  queued_commit="$(get_release_branch_commit_for_pr "${release_branch}" "${pr_number}")"

  if [ -z "${queued_commit}" ]; then
    exclude_pr_from_release "${pr_number}"
    sync_release_pr_body "${release_number}" "${release_branch}"
    return 0
  fi

  git checkout -B "${release_branch}" "origin/${release_branch}"
  git revert --no-edit "${queued_commit}"

  latest_message="$(git log -1 --pretty=%B)"
  git commit --amend -m "${latest_message}

Release-Queue-Dequeue-PR: ${pr_number}"

  git push origin "HEAD:${release_branch}"

  exclude_pr_from_release "${pr_number}"
  sync_release_pr_body "${release_number}" "${release_branch}"

  if [ -n "${comment_body}" ]; then
    gh pr comment "${pr_number}" --body "${comment_body}"
  fi
}

repo_name_with_owner() {
  if [ -n "${GITHUB_REPOSITORY:-}" ]; then
    printf '%s\n' "${GITHUB_REPOSITORY}"
    return 0
  fi

  gh repo view --json nameWithOwner --jq '.nameWithOwner'
}

list_pr_commit_shas() {
  local pr_number="$1"
  local repo
  repo="$(repo_name_with_owner)"

  gh api "repos/${repo}/pulls/${pr_number}/commits" --jq '.[].sha'
}

ensure_backmerge_pr() {
  local existing_pr title body_file pr_url

  existing_pr="$(gh pr list \
    --base "${RELEASE_SOURCE_BRANCH}" \
    --head "${RELEASE_TARGET_BRANCH}" \
    --state open \
    --json number,title,url,headRefName,baseRefName \
    | jq -c 'first // empty')"

  if [ -n "${existing_pr}" ]; then
    printf '%s\n' "${existing_pr}"
    return 0
  fi

  title="Backmerge ${RELEASE_TARGET_BRANCH} into ${RELEASE_SOURCE_BRANCH}"
  body_file="$(mktemp)"
  cat > "${body_file}" <<EOF
## Backmerge

- Source branch: \`${RELEASE_TARGET_BRANCH}\`
- Target branch: \`${RELEASE_SOURCE_BRANCH}\`
- Generated at: $(release_now)

This PR keeps \`${RELEASE_SOURCE_BRANCH}\` aligned with what has already shipped from \`${RELEASE_TARGET_BRANCH}\`.
EOF

  pr_url="$(gh pr create \
    --base "${RELEASE_SOURCE_BRANCH}" \
    --head "${RELEASE_TARGET_BRANCH}" \
    --title "${title}" \
    --body-file "${body_file}")"
  rm -f "${body_file}"

  gh pr view "${pr_url}" --json number,title,url,headRefName,baseRefName --jq '.'
}
