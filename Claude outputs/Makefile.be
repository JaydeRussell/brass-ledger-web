.PHONY: help build run test lint fmt tidy clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  %-10s %s\n", $$1, $$2}'

build: ## Compile the server binary to bin/server
	go build -o bin/server ./cmd/server

run: ## Run the server locally (reads .env via godotenv — see .env.example)
	go run ./cmd/server

test: ## Run the test suite
	go test ./...

lint: ## Vet the code and fail if anything isn't gofmt-formatted
	go vet ./...
	@unformatted="$$(gofmt -l .)"; \
	if [ -n "$$unformatted" ]; then \
		echo "The following files need gofmt:"; \
		echo "$$unformatted"; \
		exit 1; \
	fi

fmt: ## Reformat all Go source in place
	gofmt -w .

tidy: ## Sync go.mod/go.sum with actual imports (needs network)
	go mod tidy

clean: ## Remove build output
	rm -rf bin
