#!/usr/bin/env bash
set -euo pipefail

# Installs deps and runs the README generation script.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT"

echo "Installing dependencies..."
npm ci --ignore-scripts 2>/dev/null || npm install

echo "Generating README..."
npx tsx readme/generate.ts

echo "README generation complete."
