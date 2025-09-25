FROM node:18-alpine AS deps  
WORKDIR /app  
COPY package.json yarn.lock* ./  
RUN yarn install --frozen-lockfile --production=false && yarn cache clean  
  
# Stage 2: Build  
FROM node:18-alpine AS builder  
WORKDIR /app  
COPY --from=deps /app/node_modules ./node_modules  
COPY . .  
ARG APP_NAME  
RUN yarn build:${APP_NAME}  
  
# Stage 3: Production dependencies only  
FROM node:18-alpine AS prod-deps  
WORKDIR /app  
COPY package.json yarn.lock* ./  
COPY .yarnclean ./  
RUN yarn install --frozen-lockfile --production=true --ignore-scripts && \  
    yarn autoclean --force && \  
    yarn cache clean  
  
# Stage 4: Runtime  
FROM node:18-alpine AS runtime  
RUN apk add --no-cache dumb-init  
WORKDIR /app  
RUN addgroup -g 1001 -S nodejs && \  
    adduser -S nestjs -u 1001  
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules  
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist  
COPY --chown=nestjs:nodejs package.json ./  
USER nestjs  
EXPOSE 3000  
ENTRYPOINT ["dumb-init", "--"]  
CMD ["yarn", "start:prod"]

