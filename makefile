# ai-image-generated-ai-cli (simpill) — make targets (see 'make help')

.PHONY: check help image batch-sprites web-install web-dev web-build web-test

check:
	npm run lint && npm run typecheck && npm run test && npm run build

help:
	@echo "Targets:"
	@echo "  check         - lint, typecheck, test, build"
	@echo "  image         - run gemini/openai image CLI (ARGS=\"--prompt ...\")"
	@echo "  batch-sprites - batch generate 20 isometric sprites per preset (ARGS=\"--dry-run\" optional)"
	@echo "  web-install   - npm install"
	@echo "  web-dev       - next dev"
	@echo "  web-build     - next build"
	@echo "  web-test      - vitest run"
	@echo "  help          - this message"

image:
	@npm run image -- $(ARGS)

batch-sprites:
	@npm run batch-sprites -- $(ARGS)

web-install:
	npm install

web-dev:
	npm run dev

web-build:
	npm run build

web-test:
	npm run test
