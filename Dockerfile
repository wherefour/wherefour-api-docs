# Build the Redoc bundle from spec/ so the image is reproducible from source rather
# than from whatever public/index.html happens to be committed.
FROM node:22.12-alpine AS build

WORKDIR /build

# corepack pins yarn from package.json's `packageManager` field.
RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./
RUN yarn install --immutable

COPY redocly.yaml ./
COPY spec ./spec
RUN yarn redocly build-docs spec/openapi.json --output=public/index.html

# ---------------------------------------------------------------------------

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/public /usr/share/nginx/html

EXPOSE 80
