FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy repo
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Start API by default
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
