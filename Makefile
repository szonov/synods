#!/usr/bin/make
# Makefile readme (ru): <http://linux.yaroslavl.ru/docs/prog/gnu_make_3-79_russian_manual.html>
# Makefile readme (en): <https://www.gnu.org/software/make/manual/html_node/index.html#SEC_Contents>

## load environments from .env
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

## define excluded files from build
FF_IGNORE_FILES = --ignore-files jsconfig.json Makefile

.PHONY : help lint build sign chrome ff
.DEFAULT_GOAL : help

# This will output the help for each task. thanks to https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help: ## Show this help
	@printf "\033[33m%s:\033[0m\n" 'Available commands'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[32m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

lint: ff ## Linting
	web-ext lint $(FF_IGNORE_FILES)
	make chrome

build: ff ## Build for Firefox
	web-ext build --overwrite-dest $(FF_IGNORE_FILES)
	make chrome

sign: ff ## Sign Firefox Build
	web-ext sign --channel=unlisted --api-key=$(AMO_JWT_ISSUER) --api-secret=$(AMO_JWT_SECRET) $(FF_IGNORE_FILES)
	make chrome

chrome: ## Switch working version to use Chrome manifest
	jq '.background = {service_worker: "background.js", type: "module"}' manifest.json > tmp.json && mv tmp.json manifest.json

ff: ## Switch working version to use Firefox manifest
	jq '.background = {scripts: ["background.js"], type: "module"}' manifest.json > tmp.json && mv tmp.json manifest.json
