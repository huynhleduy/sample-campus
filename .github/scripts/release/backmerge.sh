#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/release/common.sh
source "${SCRIPT_DIR}/common.sh"

require_gh_auth
configure_git

backmerge_pr="$(ensure_backmerge_pr)"
backmerge_number="$(printf '%s' "${backmerge_pr}" | jq -r '.number')"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "backmerge_pr_number=${backmerge_number}" >> "${GITHUB_OUTPUT}"
fi
