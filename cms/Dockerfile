FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate || true
EXPOSE 4000
CMD ["npm", "run", "start:dev"]
