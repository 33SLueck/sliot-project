# Development Dockerfile for Next.js
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

# Entrypoint script for migration, seeding, and app start
COPY docker-deploy.sh ./docker-deploy.sh
RUN chmod +x ./docker-deploy.sh
CMD ["./docker-deploy.sh"]