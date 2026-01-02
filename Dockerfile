# Use Node.js 22
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build application
# Pass VITE_API_URL as build argument so Vite can read it at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Expose port
EXPOSE 8085

# Start application
CMD ["npm", "run", "preview"]

