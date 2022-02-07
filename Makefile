PKG_LIST := $(shell go list ./... | grep -v /vendor/)
USERNAME ?= mloberg

help:
	@echo "+ $@"
	@grep -hE '(^[a-zA-Z0-9\._-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m## /[33m/'
.PHONY: help

mod: ## Make sure go.mod is up to date
	@echo "+ $@"
	@go mod tidy
.PHONY: mod

lint: ## Lint code
	@echo "+ $@"
	@golangci-lint run
.PHONY: lint

format: ## Format code
	@echo "+ $@"
	@golangci-lint run --fix
.PHONY: format

generate: ## Autogenerate docs and resources
	@echo "+ $@"
	@go generate ${PKG_LIST}
.PHONY: generate
