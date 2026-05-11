#!/bin/bash
set -e
echo "Building API for Vercel..."
corepack enable pnpm
pnpm install
pnpm --filter @workspace/api-server run build
ls -la artifacts/api-server/dist/
