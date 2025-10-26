#!/usr/bin/env bash
# Usage:
#   ./scripts/git-commit-and-push.sh "Your commit message"

set -euo pipefail

MSG=${1:-"chore(tests): add/adjust Playwright POM tests and configs"}

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d .git ]; then
  echo "Error: this directory is not a git repository. Initialize one or run this from the repo root." >&2
  exit 1
fi

echo "Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "No changes to commit." && exit 0
fi

echo "Committing with message: $MSG"
git commit -m "$MSG"

# Try to push to current upstream branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing branch $BRANCH to origin..."
git push origin "$BRANCH"

echo "Done. If push failed, check your remote settings and authentication." 
