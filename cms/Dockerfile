FROM node:20-alpine

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache \
    openssl \
    libc6-compat

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate || true
EXPOSE 4000
CMD ["npm", "start"]
