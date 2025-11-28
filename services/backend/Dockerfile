FROM node:18-alpine

WORKDIR /app

# Copy package metadata
COPY package*.json ./

# Install ALL dependencies (dev + prod)
# because we need TypeScript compiler (tsc) at build time
RUN npm install

# Copy backend source
COPY . .

# Build TypeScript project
RUN npm run build

EXPOSE 4000

# Start compiled server
CMD ["npm", "run", "start"]
