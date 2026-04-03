#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/release/common.sh
source "${SCRIPT_DIR}/common.sh"

: "${PR_NUMBER:?PR_NUMBER is required}"

require_gh_auth
configure_git
ensure_release_labels

dequeue_pr_from_active_release "${PR_NUMBER}" "Removed from the active release queue."
