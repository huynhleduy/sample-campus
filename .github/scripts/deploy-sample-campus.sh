#!/usr/bin/env bash

set -euo pipefail

echo "No infrastructure-specific deploy adapter has been configured yet."
echo "Environment: ${DEPLOY_ENVIRONMENT}"
echo "Image: ${IMAGE_REF}"
echo
echo "Replace .github/scripts/deploy-sample-campus.sh with your platform adapter."
echo "The workflow contract stays stable as long as the script keeps reading:"
echo "  - IMAGE_REF"
echo "  - DEPLOY_ENVIRONMENT"
