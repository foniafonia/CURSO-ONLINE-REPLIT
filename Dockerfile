FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.11.0

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
