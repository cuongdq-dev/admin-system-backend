FROM node:23-alpine AS dist

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

COPY .env.docker ./.env
COPY common/modules/database ./
RUN yarn "migration:generate"

COPY apps/admin ./apps/admin
COPY common ./common
COPY nest-cli.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./

RUN yarn "build:admin"

FROM node:23-alpine AS node_modules
COPY package.json yarn.lock ./
RUN yarn --prod --frozen-lockfile

COPY .env.docker ./.env
COPY common/modules/database ./
RUN yarn "migration:generate"


RUN npm prune --production
RUN rm -rf node_modules/rxjs/src/
RUN rm -rf node_modules/rxjs/bundles/
RUN rm -rf node_modules/rxjs/_esm5/
RUN rm -rf node_modules/rxjs/_esm2015/
RUN rm -rf node_modules/swagger-ui-dist/*.map
RUN rm -rf node_modules/couchbase/src/

FROM node:23-alpine
RUN addgroup -S backend-admin && adduser -S backend-admin -G backend-admin

WORKDIR /usr/src/app

COPY --chown=backend-admin:backend-admin --from=dist dist /usr/src/apps/dist
COPY --chown=backend-admin:backend-admin --from=node_modules node_modules /usr/src/apps/node_modules
COPY --chown=backend-admin:backend-admin prisma /usr/src/apps
COPY --chown=backend-admin:backend-admin . /usr/src/apps
COPY --chown=backend-admin:backend-admin ./.env.docker /usr/src/apps/.env

CMD yarn "start:admin-prod"