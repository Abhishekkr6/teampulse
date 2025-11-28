FROM node:18-bullseye

WORKDIR /app

# Copy ONLY package files
COPY package.json package-lock.json* ./

# Install dependencies inside container
RUN npm install

# Copy tsconfig + src code
COPY tsconfig.json ./
COPY src ./src

# Build TS to dist folder
RUN npm run build

# Copy rest files (NOT node_modules)
COPY . .

# Workers do NOT need to expose any port
# EXPOSE not needed

# Run workers (start worker.js)
CMD ["node", "dist/worker.js"]
