ARG NODE_VERSION=22.17.0

FROM node:${NODE_VERSION}-alpine AS base

ENV REDISMS_DISABLE_POSTINSTALL=1
ENV YARN_CACHE_FOLDER=/tmp/.yarn-cache

WORKDIR /app

RUN apk --no-cache add \
  g++ \
  make \
  py3-pip \
  curl \
  gcc \
  python3 \
  linux-headers \
  binutils-gold \
  gnupg \
  libstdc++ \
  nss

FROM base AS deps

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --ignore-engines

FROM deps AS build

COPY . .

RUN yarn build:docker

FROM deps AS prod-deps

RUN yarn install --frozen-lockfile --ignore-engines --production=true --ignore-optional --prefer-offline

FROM node:${NODE_VERSION}-alpine AS production

ARG APP_VERSION=0.0.0

RUN apk --no-cache add tini nss

ENV NODE_ENV=production
ENV PORT=4000
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/yarn.lock ./yarn.lock

RUN mkdir -p /app/mezon-cache && chown -R node:node /app

USER node

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["sh", "-c", "yarn migrate:prod && yarn start:prod"]
