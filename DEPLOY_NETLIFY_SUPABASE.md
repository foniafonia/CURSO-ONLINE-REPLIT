# Deploy gratis: Netlify + Supabase

## 1) Sube cambios a GitHub
```bash
cd "/Users/joseaserraf/Documents/New project 5/repo"
git add .
git commit -m "Netlify deploy setup (functions + redirects)"
git push origin main
```

## 2) Crear proyecto Supabase (gratis)
1. Entra en https://supabase.com/dashboard/projects
2. Crea proyecto en región EU.
3. Copia `DATABASE_URL` (Connection string URI).

## 3) Deploy en Netlify
1. Entra en https://app.netlify.com
2. `Add new site` -> `Import an existing project` -> GitHub -> repo `CURSO-ONLINE-REPLIT`.
3. Netlify detectará `netlify.toml` (no cambies build/publish).

## 4) Variables de entorno en Netlify
En `Site configuration -> Environment variables` añade:
- `NODE_ENV=production`
- `BASE_PATH=/`
- `DATABASE_URL=<SUPABASE_DATABASE_URL>`
- `ADMIN_SECRET=<clave_larga_segura>`
- `STRIPE_SECRET_KEY=<sk_test_o_sk_live>`
- `STRIPE_WEBHOOK_SECRET=<whsec...>`
- `PUBLIC_APP_URL=https://TU-SITIO.netlify.app`
- Email: `BREVO_API_KEY` o `RESEND_API_KEY` (según uses)

## 5) Stripe webhook
En Stripe Dashboard -> Developers -> Webhooks:
- Endpoint: `https://TU-SITIO.netlify.app/api/checkout/webhook`
- Evento: `checkout.session.completed`
- Copia el secret al env `STRIPE_WEBHOOK_SECRET`.

## 6) Verificación final
1. Abre landing.
2. Rellena formulario y click reservar.
3. Debe abrir Stripe Checkout.
4. Paga en modo test.
5. Debe volver a `/gracias?session_id=...`.
6. Revisa `/admin`.
7. Confirma email de inscripción.
