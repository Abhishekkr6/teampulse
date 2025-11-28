FROM node:18-bullseye

WORKDIR /app

# Copy ONLY package files first
COPY package.json package-lock.json* ./

# Install deps fresh inside Linux container
RUN npm install

# Copy ONLY src + tsconfig (prevent Windows polluted .bin copies)
COPY tsconfig.json ./
COPY src ./src

# Build TS
RUN npm run build

# Copy remaining NON-BUILD files (not node_modules!)
COPY . .

EXPOSE 4000

CMD ["npm", "run", "start"]
