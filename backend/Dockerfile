# Backend runtime
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production dependencies only (smaller image)
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]