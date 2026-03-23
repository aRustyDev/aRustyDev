#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/build-pdf.sh <slug>
# Renders a resume profile to .tex then compiles to PDF via tectonic.

SLUG="${1:?Usage: build-pdf.sh <slug>}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PROFILE="$REPO_ROOT/data/resumes/${SLUG}.json"
if [[ ! -f "$PROFILE" ]]; then
  echo "Error: Profile not found: $PROFILE" >&2
  exit 1
fi

# Ensure build directory exists
mkdir -p "$REPO_ROOT/build"

# Step 1: Render .tex from JSON
echo "Rendering ${SLUG}.tex..."
npx tsx "$REPO_ROOT/scripts/render-tex-cli.ts" "$SLUG" > "$REPO_ROOT/build/${SLUG}.tex"

# Step 2: Compile .tex to .pdf
echo "Compiling ${SLUG}.pdf..."
cd "$REPO_ROOT/build"
tectonic "${SLUG}.tex"

# Step 3: Move to site output
mkdir -p "$REPO_ROOT/site/public/resumes"
mv "${SLUG}.pdf" "$REPO_ROOT/site/public/resumes/${SLUG}.pdf"

echo "Done: site/public/resumes/${SLUG}.pdf"
