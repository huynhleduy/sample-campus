#!/usr/bin/env bash

set -euo pipefail

echo "No infrastructure-specific rollback adapter has been configured yet."
echo "Environment: ${DEPLOY_ENVIRONMENT}"
echo "Rollback target: ${ROLLBACK_TARGET}"

if [ -n "${ROLLBACK_REASON:-}" ]; then
  echo "Reason: ${ROLLBACK_REASON}"
fi

echo
echo "Replace .github/scripts/rollback-sample-campus.sh with your platform adapter."
echo "The workflow contract stays stable as long as the script keeps reading:"
echo "  - DEPLOY_ENVIRONMENT"
echo "  - ROLLBACK_TARGET"
echo "  - ROLLBACK_REASON"
