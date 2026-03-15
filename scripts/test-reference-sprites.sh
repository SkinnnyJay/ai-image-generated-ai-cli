#!/usr/bin/env sh
# Run generation test using reference sprites 7, 8, 9 from data/games/pokemon/red-blue/front.
# Output: ./tmp/generated/7.png, 8.png, 9.png
# Requires GEMINI_API_KEY in .env or .env.local (copy from .env.sample).

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
META="${ROOT}/data/games/pokemon/red-blue/meta-single.json"
OUT="${ROOT}/tmp/generated"
PROMPT="Upgrade this character into cute modern art: Studio Ghibli inspired (soft watercolor feel, expressive eyes, gentle lighting, hand-drawn quality, whimsical) or slick modern anime (clean lines, cel-shaded, vibrant colors, polished). Keep the exact same character design and pose as the reference. Single character illustration, transparent background, high-quality."

cd "$ROOT"
mkdir -p "$OUT"
npm run cli:build --silent 2>/dev/null || true

for id in 7 8 9; do
  echo "Generating from front/${id}.png..."
  npm run cli -- generate \
    --prompt "$PROMPT" \
    --input-image "${ROOT}/data/games/pokemon/red-blue/front/${id}.png" \
    --input-meta "$META" \
    --output-image "${OUT}/${id}.png" \
    --engine gemini
done

echo "Done. Output: ${OUT}/7.png, ${OUT}/8.png, ${OUT}/9.png"
