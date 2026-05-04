# Deploy en Railway (sin Replit)

## Estado actual
- Proyecto Railway enlazado: `curso-ia-preventa` (entorno `production`).
- El código ya está adaptado para funcionar fuera de Replit.
- Bloqueo actual en Railway: **trial expirado** (hay que seleccionar plan para crear servicios).

## 1) Crea servicios en Railway
Desde este repo:

```bash
railway add --service api
railway add --service web
railway add --database postgres
```

## 2) Configura servicio `api`
En Railway UI (servicio `api`):
- Root Directory: `artifacts/api-server`
- Build Command: `pnpm run build`
- Start Command: `pnpm run start`

Variables del servicio `api`:
- `NODE_ENV=production`
- `ADMIN_SECRET=<clave-larga-segura>`
- `PUBLIC_APP_URL=https://<dominio-del-web>`
- `STRIPE_SECRET_KEY=<sk_live_o_sk_test>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`
- `DATABASE_URL=<la de postgres de Railway>`

Correo (mantener lo que ya tenías):
- Opción A: `BREVO_API_KEY=...`
- Opción B: `RESEND_API_KEY=...`
- Opción C: mantener integración Gmail existente si aplica en tu runtime

## 3) Configura servicio `web`
En Railway UI (servicio `web`):
- Root Directory: `artifacts/logoped-ia`
- Build Command: `pnpm run build`
- Start Command: `pnpm run serve`

Variables del servicio `web`:
- `NODE_ENV=production`
- `BASE_PATH=/`
- `VITE_API_BASE_URL=https://<dominio-del-api>`

## 4) Webhook Stripe
En Stripe Dashboard:
- Endpoint: `https://<dominio-del-api>/api/checkout/webhook`
- Evento: `checkout.session.completed`
- Copia el secret a `STRIPE_WEBHOOK_SECRET`.

## 5) Verificación rápida
1. Abrir web pública.
2. Hacer checkout de prueba.
3. Confirmar que:
   - vuelve a `/gracias`
   - inscripción pasa a `completed`
   - llega email de confirmación
4. Entrar a `/admin` con `ADMIN_SECRET`.

## Notas
- Ya no dependes de Replit Connectors para Stripe si defines `STRIPE_SECRET_KEY`.
- El backend bloquea sobreventa al alcanzar 20 plazas.
- El webhook finaliza pago aunque el usuario no visite la página de gracias.
