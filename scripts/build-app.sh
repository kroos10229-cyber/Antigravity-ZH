#!/bin/zsh
set -eu

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCE_ROOT="$PROJECT_ROOT/Antigravity-ZH.app/Contents/Resources"
rm -rf "$RESOURCE_ROOT"
mkdir -p "$RESOURCE_ROOT"
ditto "$PROJECT_ROOT/src" "$RESOURCE_ROOT/src"
ditto "$PROJECT_ROOT/translations" "$RESOURCE_ROOT/translations"
ditto "/Applications/Antigravity.app/Contents/Resources/icon.icns" "$RESOURCE_ROOT/icon.icns"
printf 'Packed launcher resources into %s\n' "$RESOURCE_ROOT"
