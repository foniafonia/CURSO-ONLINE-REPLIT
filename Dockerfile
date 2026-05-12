FROM node:20-alpine

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY artifacts ./artifacts
COPY lib ./lib

RUN corepack enable pnpm && pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
