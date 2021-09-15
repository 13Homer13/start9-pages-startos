EMVER := $(shell tq -f manifest.toml "version" | sed -e 's/^"//' -e 's/"//')
ASSET_PATHS := $(shell find ./assets/*)

.DELETE_ON_ERROR:

all: embassy-pages.s9pk

install: embassy-pages.s9pk
	appmgr install embassy-pages.s9pk

embassy-pages.s9pk: manifest.toml image.tar instructions.md LICENSE icon.png ${ASSET_PATHS}
	embassy-sdk pack

image.tar: Dockerfile docker_entrypoint.sh
	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build --tag start9/embassy-pages/main:${EMVER} --platform=linux/arm64/v8 -o type=docker,dest=image.tar .
