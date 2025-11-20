# Use Node 20 for Vite compatibility
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start dev server with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
