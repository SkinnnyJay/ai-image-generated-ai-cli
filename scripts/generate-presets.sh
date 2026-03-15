#!/usr/bin/env sh
# Generate one image per preset from data/games/pokemon/red-blue/presets.json.
# Usage: ./scripts/generate-presets.sh [--subject "fire creature"] [--out ./out]
# Requires GEMINI_API_KEY (or OPENAI_API_KEY / XAI_API_KEY) in .env or .env.local.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PRESET_FILE="${ROOT}/data/games/pokemon/red-blue/presets.json"
SUBJECT="${SUBJECT:-small creature}"
OUT_DIR="${OUT_DIR:-${ROOT}/.temp/preset-output}"

while [ $# -gt 0 ]; do
  case "$1" in
    --subject) SUBJECT="$2"; shift 2 ;;
    --out)     OUT_DIR="$2"; shift 2 ;;
    *)         echo "Unknown option: $1"; exit 1 ;;
  esac
done

cd "$ROOT"
npm run cli:build --silent 2>/dev/null || true

PRESETS="front-gb-pixel back-gb-pixel front-16bit back-16bit front-flat-vector back-flat-vector front-cel-shaded back-cel-shaded front-minimal back-minimal"
mkdir -p "$OUT_DIR"

for id in $PRESETS; do
  echo "Generating: $id"
  npm run cli -- generate \
    --preset-file "$PRESET_FILE" \
    --preset "$id" \
    --subject "$SUBJECT" \
    --out "${OUT_DIR}/${id}.png" \
    --engine gemini
done

echo "Done. Output: $OUT_DIR"
