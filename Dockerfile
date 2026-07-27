FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies for all workspaces
RUN npm install

# Build shared and server
RUN npm run build -w @futbol-cabezones/shared
RUN npm run build -w @futbol-cabezones/server

# Expose the port the server runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start", "-w", "@futbol-cabezones/server"]
