# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for ts-node-dev)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3002

# Start the application
CMD ["npm", "run", "dev"]
