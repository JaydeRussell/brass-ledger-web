#!/usr/bin/env bash
# Requests every page route at BASE and fails if any answers 5xx. Catches
# a page that only breaks on the deployed Workers runtime (vinext), which
# `next build` and the unit tests can't see: /admin's server redirect()
# answered 500 there while working under `next start`.
#
#   scripts/route-smoke.sh http://localhost:8788       # a `wrangler dev` of the vinext build
#   scripts/route-smoke.sh https://brass-ledger.app    # production
set -euo pipefail
base="${1:?usage: route-smoke.sh BASE_URL}"
routes=(
  / /event /my-events /search /calendar /stats /friends /wiki /about /changelog
  /login /welcome /admin /admin/accounts /admin/feedback
  /follow/smoke-test /dossier/smoke-test /players/smoke-test
)
failed=0
for route in "${routes[@]}"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$base$route" || echo 000)"
  if [[ "$code" == 5* || "$code" == 000 ]]; then
    echo "FAIL  $code $route"
    failed=1
  else
    echo "ok    $code $route"
  fi
done
exit "$failed"
