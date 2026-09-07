.PHONY: help install build run start test lint clean docker-build docker-run

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  %-10s %s\n", $$1, $$2}'

install: ## Install dependencies (npm ci — uses the committed lockfile)
	npm ci

build: ## Production build
	npm run build

run: ## Run the dev server (localhost:3000, hot reload)
	npm run dev

start: ## Serve the production build made by `make build`
	npm start

test: ## Run the test suite (Node's built-in test runner — no extra dependency)
	npm test

lint: ## Lint + typecheck
	npm run lint
	npx tsc --noEmit

clean: ## Remove build output
	rm -rf .next

docker-build: ## Build this app's standalone Docker image
	docker build -t brass-ledger-web .

docker-run: ## Run the image built above by itself, on localhost:3000
	docker run --rm -p 3000:3000 brass-ledger-web

# For the whole stack (this app + the backend + Postgres) together, use
# `make docker-up` in ../brass-ledger-api instead — that's what
# wires this app up to a real backend via NEXT_PUBLIC_BACKEND_URL.
