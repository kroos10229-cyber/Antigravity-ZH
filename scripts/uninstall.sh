#!/bin/zsh
set -eu

TARGET_ROOT="${ANTIGRAVITY_ZH_INSTALL_DIR:-$HOME/Applications/Antigravity-ZH}"
if [[ ! -e "$TARGET_ROOT" ]]; then
  printf 'Nothing installed at %s\n' "$TARGET_ROOT"
  exit 0
fi
TRASH_ROOT="$HOME/.Trash/Antigravity-ZH-$(date +%Y%m%d-%H%M%S)"
mv "$TARGET_ROOT" "$TRASH_ROOT"
printf 'Moved %s to %s\n' "$TARGET_ROOT" "$TRASH_ROOT"
