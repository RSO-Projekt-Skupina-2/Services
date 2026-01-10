# --- Build stage ---
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json .
COPY src ./src

RUN npx tsc

# --- Runtime stage ---
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3004

CMD ["node", "dist/index.js"]
