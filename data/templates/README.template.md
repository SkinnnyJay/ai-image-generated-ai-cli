# Asset folder

- Put reference images in `front/` and/or `back/` (e.g. PNG).
- Use `meta-single.json` for single-frame reference (frameWidth x frameHeight, frameCount: 1).
- Use `presets.json` for style/angle presets; list with: `ai-image-gen list-presets --preset-file presets.json`.

Generate one image:
  ai-image-gen generate --prompt "..." --input-image front/1.png --input-meta meta-single.json --output-image out/1.png

Batch (folder):
  ai-image-gen generate-batch --input-dir front --output-dir out --meta meta-single.json --prompt "..."

Interactive review:
  ai-image-gen review --input-dir front --output-dir out --meta meta-single.json --prompt "..."
