#!/bin/bash
set -e
echo "Building Web for Vercel..."
corepack enable pnpm
pnpm install
pnpm --filter @workspace/logoped-ia run build
ls -la artifacts/logoped-ia/dist/public/
