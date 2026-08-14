#!/bin/zsh
set -eu

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
/usr/bin/env node "$PROJECT_ROOT/src/scanner/version-check.mjs" --write
if /usr/bin/env node "$PROJECT_ROOT/src/scanner/scan.mjs"; then
  printf 'Updated %s/reports/untranslated.md\n' "$PROJECT_ROOT"
else
  printf 'Version information updated. Start Antigravity-ZH first to scan live UI strings.\n' >&2
fi
