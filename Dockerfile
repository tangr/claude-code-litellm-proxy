# Node.js application with multi-stage build

# Development stage
FROM node:24-alpine AS development
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# Production stage
FROM node:24-alpine AS production
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies for building
RUN npm ci

# Copy source code and config
COPY src/ ./src/
COPY config/ ./config/
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
