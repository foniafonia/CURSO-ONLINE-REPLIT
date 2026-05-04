# Logoped-IA — Curso Online de Logopedia con IA

## Overview

Full-stack web application for an online speech therapy (logopedia) course. Features a landing/sales page with presale pricing, Stripe payments, automatic confirmation emails, and an admin dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (wouter routing, TanStack Query, shadcn/ui, Tailwind CSS)
- **Backend**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **Payments**: Stripe (via Replit integration)
- **Emails**: Resend API (set RESEND_API_KEY to enable; falls back to console log)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/logoped-ia` — React + Vite frontend (preview path: `/`)
- `artifacts/api-server` — Express API server (preview path: `/api`)

## Pricing Logic

- **Presale**: €39 for the first 10 completed enrollments
- **Regular**: €79 for everyone after
- Logic lives in `artifacts/api-server/src/routes/course.ts` and `checkout.ts`
- `PRESALE_SPOTS = 10` constant

## Admin Panel

- URL: `/admin`
- Password: `logoped-ia-admin-2026` (or set `ADMIN_SECRET` env var)
- Features: stats, full enrollments table, CSV export, resend confirmation emails

## Email Setup

Set the `RESEND_API_KEY` environment variable with your Resend API key to enable real email sending. Without it, emails are logged to console only.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## DB Schema

- `lib/db/src/schema/enrollments.ts` — Enrollment table with name, email, phone, pricePaid, isPresale, status, stripeSessionId, emailSent

## API Routes

- `GET /api/course/info` — Current price and availability
- `POST /api/checkout/create` — Create Stripe checkout session
- `GET /api/checkout/verify?session_id=X` — Verify payment and complete enrollment
- `GET /api/admin/enrollments` — List all enrollments (requires `x-admin-secret` header)
- `GET /api/admin/stats` — Admin statistics (requires `x-admin-secret` header)
- `POST /api/admin/enrollments/:id/resend-email` — Resend confirmation email

## Notes

- Resend integration was not set up (user dismissed the OAuth flow). Use `RESEND_API_KEY` env var instead.
- Stripe is connected via Replit integration (sandbox mode in development, production mode when deployed).
