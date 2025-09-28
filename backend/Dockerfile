FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
RUN addgroup -S nodeapp \
	&& adduser -S nodeapp -G nodeapp \
	&& chown -R nodeapp:nodeapp /app
USER nodeapp
EXPOSE 3001
CMD ["npm", "start"]