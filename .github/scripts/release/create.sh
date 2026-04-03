#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/release/common.sh
source "${SCRIPT_DIR}/common.sh"

require_gh_auth
configure_git
ensure_release_labels

active_pr="$(ensure_active_release_pr)"
release_number="$(printf '%s' "${active_pr}" | jq -r '.number')"
release_branch="$(printf '%s' "${active_pr}" | jq -r '.headRefName')"

sync_release_pr_body "${release_number}" "${release_branch}"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "release_pr_number=${release_number}" >> "${GITHUB_OUTPUT}"
  echo "release_branch=${release_branch}" >> "${GITHUB_OUTPUT}"
fi
