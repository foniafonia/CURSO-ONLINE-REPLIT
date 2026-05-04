# Deploy gratis: Vercel + Supabase

## Arquitectura
- Proyecto 1 (Vercel): `web` (frontend React/Vite) en `artifacts/logoped-ia`
- Proyecto 2 (Vercel): `api` (Express como Serverless Function) en `artifacts/api-server`
- Base de datos: Supabase Postgres (plan free)

## 1) Supabase
1. Crea proyecto en [Supabase](https://supabase.com/dashboard).
2. Copia `DATABASE_URL` (Connection string URI).

## 2) Vercel API
1. En Vercel: `Add New -> Project`.
2. Importa `CURSO-ONLINE-REPLIT`.
3. Root directory: `artifacts/api-server`.
4. Variables de entorno:
   - `NODE_ENV=production`
   - `DATABASE_URL=<SUPABASE_DATABASE_URL>`
   - `ADMIN_SECRET=<clave_larga_segura>`
   - `STRIPE_SECRET_KEY=<sk_live_o_sk_test>`
   - `STRIPE_WEBHOOK_SECRET=<whsec_...>`
   - `PUBLIC_APP_URL=https://TU-WEB.vercel.app`
   - Opcional email: `BREVO_API_KEY` o `RESEND_API_KEY`
5. Deploy.
6. Guarda URL de API: `https://TU-API.vercel.app`

## 3) Vercel Frontend
1. En Vercel: `Add New -> Project`.
2. Importa mismo repo.
3. Root directory: `artifacts/logoped-ia`.
4. Variables de entorno:
   - `BASE_PATH=/`
   - `VITE_API_BASE_URL=https://TU-API.vercel.app`
5. Deploy.
6. Guarda URL web: `https://TU-WEB.vercel.app`

## 4) Actualizar URL pública en API
En el proyecto `api`, cambia:
- `PUBLIC_APP_URL=https://TU-WEB.vercel.app`
Luego redeploy de API.

## 5) Webhook Stripe
En Stripe Dashboard:
- Endpoint: `https://TU-API.vercel.app/api/checkout/webhook`
- Evento: `checkout.session.completed`
- Copia secret a `STRIPE_WEBHOOK_SECRET`.

## 6) Checklist rápido
1. Abrir web.
2. Enviar formulario de reserva.
3. Ir a Stripe Checkout.
4. Completar pago test.
5. Volver a `/gracias?session_id=...`.
6. Verificar en `/admin` que aparece inscripción.
7. Verificar email de confirmación.
