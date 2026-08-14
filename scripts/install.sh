#!/bin/zsh
set -eu

SOURCE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_ROOT="${ANTIGRAVITY_ZH_INSTALL_DIR:-$HOME/Applications/Antigravity-ZH}"
mkdir -p "$(dirname "$TARGET_ROOT")"
ditto "$SOURCE_ROOT" "$TARGET_ROOT"
printf 'Installed Antigravity-ZH to %s\n' "$TARGET_ROOT"
printf 'Open %s/Antigravity-ZH.app to start it. The official Antigravity.app was not modified.\n' "$TARGET_ROOT"
