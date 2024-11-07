FROM node:14-alpine AS base

COPY package.json yarn.lock ./
RUN yarn

FROM base AS dist
COPY . ./
RUN yarn build

FROM base as node_modules
RUN npm prune --production
RUN rm -rf node_modules/rxjs/src/
RUN rm -rf node_modules/rxjs/bundles/
RUN rm -rf node_modules/rxjs/_esm5/
RUN rm -rf node_modules/rxjs/_esm2015/
RUN rm -rf node_modules/swagger-ui-dist/*.map
RUN rm -rf node_modules/couchbase/src/

FROM node:14-alpine as final

RUN addgroup -S cv_curriculum_vitae_backend && adduser -S cv_curriculum_vitae_backend -G cv_curriculum_vitae_backend
USER cv_curriculum_vitae_backend

RUN mkdir -p /home/cv_curriculum_vitae_backend/app

WORKDIR /home/cv_curriculum_vitae_backend/app

COPY --from=base package.json /home/cv_curriculum_vitae_backend/app/package.json
COPY --from=dist dist /home/cv_curriculum_vitae_backend/app/dist
COPY --from=node_modules node_modules /home/cv_curriculum_vitae_backend/app/node_modules

CMD yarn "start:prod"
