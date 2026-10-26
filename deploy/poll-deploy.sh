#!/bin/bash
# Pull-based deploy. Runs from a systemd timer; deploys the newest commit on main
# once its CI "test" job has passed. No inbound access to the server is needed.
set -euo pipefail

REPO=coryfinnegan/Pointorama
STATE=/opt/pointorama/.deployed-sha
FAILED=/opt/pointorama/.failed-sha

exec 9>/var/lock/pointorama-deploy.lock
flock -n 9 || exit 0

cd /opt/pointorama/src
SHA=$(git ls-remote origin refs/heads/main | cut -f1)
[ -n "$SHA" ] || exit 0
DEPLOYED=$(cat "$STATE" 2>/dev/null || true)
[ "$SHA" != "$DEPLOYED" ] || exit 0
[ "$SHA" != "$(cat "$FAILED" 2>/dev/null || true)" ] || exit 0

git fetch -q origin main
if [ -n "$DEPLOYED" ] && git cat-file -e "$DEPLOYED^{commit}" 2>/dev/null \
   && [ -z "$(git diff --name-only "$DEPLOYED" "$SHA" -- web .github/workflows/deploy-app.yml)" ]; then
  echo "$SHA touches nothing deployable; skipping"
  echo "$SHA" > "$STATE"
  exit 0
fi

CI=$(curl -fsS "https://api.github.com/repos/$REPO/commits/$SHA/check-runs?per_page=100" | python3 -c '
import sys, json
runs = [r for r in json.load(sys.stdin)["check_runs"] if r["name"] == "test"]
if not runs: print("pending")
elif runs[0]["status"] != "completed": print("pending")
else: print("success" if runs[0]["conclusion"] == "success" else "failed")
')

case "$CI" in
  success) ;;
  failed)  echo "CI failed for $SHA; not deploying"; echo "$SHA" > "$FAILED"; exit 0 ;;
  *)       echo "CI not finished for $SHA"; exit 0 ;;
esac

echo "Deploying $SHA"
/opt/pointorama/deploy.sh "$SHA"
systemctl restart pointorama-tg || true
echo "$SHA" > "$STATE"
