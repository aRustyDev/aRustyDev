#!/usr/bin/env bash
set -euo pipefail

# Iterates all resume profiles and builds PDFs for each.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILES_DIR="$REPO_ROOT/data/resumes"

if [[ ! -d "$PROFILES_DIR" ]]; then
  echo "No profiles directory found at $PROFILES_DIR" >&2
  exit 1
fi

BUILT=0
for profile in "$PROFILES_DIR"/*.json; do
  [[ -f "$profile" ]] || continue
  SLUG=$(basename "$profile" .json)
  echo "=== Building resume: $SLUG ==="
  "$REPO_ROOT/scripts/build-pdf.sh" "$SLUG"
  BUILT=$((BUILT + 1))
done

echo "Built $BUILT PDF(s)."
