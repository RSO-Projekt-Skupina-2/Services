# --- Build stage ---
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the source code
COPY tsconfig.json .
COPY src ./src

# Build TypeScript -> JavaScript
RUN npx tsc

# --- Runtime stage ---
FROM node:18-alpine

WORKDIR /app

# Copy compiled JS and node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
