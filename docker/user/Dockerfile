FROM node:12-alpine AS dist

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY .env.docker ./.env
COPY prisma ./
RUN yarn prisma generate

COPY apps/handy ./apps/handy
COPY libs ./libs
COPY nest-cli.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./

RUN yarn "build:handy"

FROM node:12-alpine AS node_modules
COPY package.json yarn.lock ./
RUN yarn --prod --frozen-lockfile

COPY .env.docker ./.env
COPY prisma ./
RUN yarn prisma generate

RUN npm prune --production
RUN rm -rf node_modules/rxjs/src/
RUN rm -rf node_modules/rxjs/bundles/
RUN rm -rf node_modules/rxjs/_esm5/
RUN rm -rf node_modules/rxjs/_esm2015/
RUN rm -rf node_modules/swagger-ui-dist/*.map
RUN rm -rf node_modules/couchbase/src/

FROM node:12-alpine
RUN addgroup -S handy && adduser -S handy -G handy

WORKDIR /usr/src/app

COPY --chown=handy:handy --from=dist dist /usr/src/app/dist
COPY --chown=handy:handy --from=node_modules node_modules /usr/src/app/node_modules
COPY --chown=handy:handy prisma /usr/src/app
COPY --chown=handy:handy . /usr/src/app
COPY --chown=handy:handy ./.env.docker /usr/src/app/.env

CMD yarn "start:handy"