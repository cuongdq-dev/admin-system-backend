# Stage 1: Build Stage
FROM node:23-alpine as builder

WORKDIR /app

# Copy các file cấu hình
COPY package.json package-lock.json ./
COPY .env /app/.env

# Cài đặt dependencies
RUN yarn

# Copy toàn bộ mã nguồn
COPY . .


# Build ứng dụng
RUN yarn build:user
RUN yarn build:admin

# Stage 2: Final Image
FROM node:23-alpine

WORKDIR /app

# Copy build artifacts từ builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Lệnh chạy ứng dụng
CMD ["yarn", "start:prod"]
