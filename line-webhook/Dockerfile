# Use Node.js 20
FROM node:20-alpine

# Install Python for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "index.js"]

