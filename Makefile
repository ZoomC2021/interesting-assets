# REIT Comparison / data contract — common tasks
# Run `make` or `make help` to list targets.

NPM   := npm
FE    := frontend
.DEFAULT_GOAL := help

.PHONY: help install dev start \
	build build-contract build-frontend \
	typecheck typecheck-frontend typecheck-all \
	lint test test-contract test-frontend test-coverage test-all \
	validate-atrium validate-axis check-citations \
	verify-citations verify-citations-strict \
	clean ci

help: ## Show this help (default)
	@printf '%s\n' "Targets:"; \
	awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ { sub(/^	/, "", $$2); printf "  %-22s %s\n", $$1, $$2 }' $(MAKEFILE_LIST) | sort

install: ## Install root and frontend dependencies
	$(NPM) install
	cd $(FE) && $(NPM) install

dev: ## Start Next.js dev server (http://localhost:3000)
	cd $(FE) && $(NPM) run dev

start: ## Run production Next server (build first)
	cd $(FE) && $(NPM) run start

build-contract: ## Typecheck data contract (root tsc)
	$(NPM) run build

build-frontend: ## Production build (Next → frontend/dist, runs citation verify)
	cd $(FE) && $(NPM) run build

build: build-contract build-frontend ## Typecheck contract + build frontend

typecheck: build-contract ## Alias: root TypeScript check
typecheck-frontend: ## Next.js / React typecheck
	cd $(FE) && $(NPM) run type-check
typecheck-all: build-contract typecheck-frontend ## Typecheck root + frontend

lint: ## Next.js ESLint
	cd $(FE) && $(NPM) run lint

test-contract: ## Jest (data contract / shared tests at repo root)
	$(NPM) test

test-frontend: ## Jest (frontend)
	cd $(FE) && $(NPM) test

test-coverage: ## Jest with coverage (frontend)
	cd $(FE) && $(NPM) run test:coverage

test: test-contract test-frontend ## Run all test suites
test-all: test ## Same as `make test` (for scripts/CI)

validate-atrium: ## Validate atrium sample JSON against schema
	$(NPM) run validate:atrium

validate-axis: ## Validate axis sample JSON against schema
	$(NPM) run validate:axis

check-citations: ## Citation checker (root)
	$(NPM) run check:citations

verify-citations: ## Verify frontend citations
	cd $(FE) && $(NPM) run verify:citations

verify-citations-strict: ## Verify frontend citations (strict)
	cd $(FE) && $(NPM) run verify:citations:strict

clean: ## Remove build artifacts (dist, .next, coverage)
	rm -rf dist $(FE)/dist $(FE)/.next $(FE)/coverage

ci: typecheck-all lint test ## Full local quality gate (install deps first)
