# Deploy Fly.io (CLI super simple)

**Tiempo total: 15 minutos**

---

## PASO 1: Instalar Fly CLI (3 min)

Abre Terminal (en Mac: `Cmd + Espacio` → escribe "Terminal" → Enter)

Copia-pega esto:

```bash
curl -L https://fly.io/install.sh | sh
```

Presiona Enter. Espera a que termine.

---

## PASO 2: Login en Fly (2 min)

En Terminal, copia-pega:

```bash
flyctl auth login
```

Se abre tu navegador → **Click "Authorize" → vuelve a Terminal**

---

## PASO 3: Crear app en Fly (1 min)

En Terminal:

```bash
cd /Users/joseaserraf/Documents/New\ project\ 5/repo
flyctl app create curso-ia
```

Responde:
- **"Nominate organization"**: presiona Enter (default)
- **"Region"**: escribe `mad` (Madrid) → presiona Enter

---

## PASO 4: Crear Postgres en Fly (2 min)

En Terminal, copia-pega:

```bash
flyctl postgres create --name curso-ia-db --region mad
```

Responde:
- **"Select password for postgres user"**: presiona Enter (genera una automática)
- **"Confirm password"**: presiona Enter

**Espera a que termine.** Verás:
```
Your Postgres database is now available
Connection string: postgresql://...
```

**COPIA TODO ESO** (desde `postgresql://` hasta el final)

---

## PASO 5: Añadir variables de entorno en Fly (3 min)

En Terminal, copia-pega esto (reemplazando XXX):

```bash
flyctl secrets set \
  NODE_ENV=production \
  ADMIN_SECRET=mk-admin-2026-curso-ia \
  STRIPE_SECRET_KEY=sk_test_XXXXX \
  STRIPE_WEBHOOK_SECRET=whsec_XXXXX \
  PUBLIC_APP_URL=https://curso-ia.fly.dev \
  DATABASE_URL='postgresql://postgres:PASSWORD@curso-ia-db.internal:5432/cursoiadb'
```

**IMPORTANTE:** Reemplaza:
- `sk_test_XXXXX` → tu STRIPE_SECRET_KEY (de https://dashboard.stripe.com/apikeys)
- `whsec_XXXXX` → tu STRIPE_WEBHOOK_SECRET (lo obtendremos después)
- `PASSWORD` → la contraseña de Postgres que Fly generó (si no la anotaste, no pasa, Fly lo maneja)

---

## PASO 6: Deploy en Fly (5 min)

En Terminal:

```bash
flyctl deploy
```

**Espera a que termine.** Verás:
```
✓ deployed to https://curso-ia.fly.dev
```

---

## PASO 7: Obtén tu Stripe Webhook

1. Abre https://dashboard.stripe.com → Developers → Webhooks
2. Click "Add Endpoint"
3. **URL:** `https://curso-ia.fly.dev/api/checkout/webhook`
4. **Events:** selecciona `checkout.session.completed`
5. Click "Add Endpoint"
6. **Copia el secret** (empieza con `whsec_`)

---

## PASO 8: Actualiza Webhook Secret en Fly

En Terminal:

```bash
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXX
```

(Reemplaza `whsec_XXXXX` con el que copiaste)

Fly redeploy automático.

---

## ✅ VERIFICACIÓN

Abre en el navegador: `https://curso-ia.fly.dev`

Deberías ver:
- ✅ "Inteligencia artificial aplicada de verdad..."
- ✅ "20 plazas", "49€"
- ✅ Botón "Reservar"

Si ves eso, **TODO FUNCIONA.**

---

## 🔧 Si algo falla

Ver logs:

```bash
flyctl logs
```

---

**¿Listo? Dime cuando termines cada PASO.**
