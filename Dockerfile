FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
COPY packages/acum-client/package*.json ./packages/acum-client/
COPY packages/api/package*.json ./packages/api/
RUN npm install --workspaces
COPY . .
RUN npm run build --workspaces

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/acum-client/dist ./packages/acum-client/dist
COPY --from=builder /app/packages/acum-client/package.json ./packages/acum-client/
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/docs ./docs
EXPOSE 3000
CMD ["node", "packages/api/dist/index.js"]
