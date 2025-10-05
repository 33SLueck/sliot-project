# Multi-stage Dockerfile for a Node.js backend
# If your backend is not Node.js (Python, Go, etc.), replace this file accordingly.

ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# Copy package files first to leverage cache
COPY package.json package-lock.json* ./
RUN npm ci --only=production --legacy-peer-deps || npm install --only=production

FROM node:${NODE_VERSION}-alpine AS app
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 8080

# Default start command (adjust if your package.json defines a different start script)
CMD ["node", "dist/index.js"]

# Notes:
# - If you use TypeScript, ensure you build before creating the production image (e.g., `npm run build`).
# - Adjust the exposed port and CMD to match your application (for example `npm run start`).
