# Deploy Render + Vercel (SIN Replit)

**Tiempo total: 10 minutos**

---

## PASO 1: Crear cuenta Render (si no tienes)

1. Ve a https://render.com
2. Click "Sign Up"
3. Elige "GitHub" (es más fácil)
4. Autoriza Render para acceder a tu GitHub

---

## PASO 2: Deploy automático en Render

1. En Render: https://render.com/dashboard
2. Click "New +" (arriba a la derecha)
3. Click "Blueprint" (segunda opción)
4. Pega tu repo GitHub: `https://github.com/foniafonia/CURSO-ONLINE-REPLIT`
5. Click "Connect"
6. En "Select branch": mantén `main`
7. Click "Deploy" (Render lee `render.yaml` automáticamente)
8. **Espera 5-10 min** a que termine

---

## PASO 3: Variables de entorno en Render

Una vez que Render termina de buildear, ve a **cada servicio** y añade las variables:

### Servicio `curso-ia-api`:
1. Click en el servicio
2. Click "Environment" (pestaña)
3. Haz click en "Add Environment Variable" y añade **UNA POR UNA**:

```
ADMIN_SECRET = mk-admin-2026-curso-ia
STRIPE_SECRET_KEY = sk_test_... (cópialo de https://dashboard.stripe.com/apikeys)
STRIPE_WEBHOOK_SECRET = whsec_... (lo obtienes después)
PUBLIC_APP_URL = https://curso-ia-web.vercel.app (VERCEL URL, la actualizas cuando tengas)
RESEND_API_KEY = (déjalo vacío por ahora, lo rellenaremos si necesitas emails)
```

4. Click "Save" después de cada una

**Nota:** `DATABASE_URL` se crea automático (Render lo hace con la BD de Postgres).

### Servicio `curso-ia-web`:
1. Click en el servicio
2. Click "Environment"
3. Añade:

```
VITE_API_BASE_URL = https://curso-ia-api.onrender.com (URL del API que Render te generó)
```

4. Click "Save"

---

## PASO 4: Obtén tu URL de Stripe Webhook

1. Ve a https://dashboard.stripe.com → Developers → Webhooks
2. Click "Add Endpoint"
3. **URL endpoint:** `https://curso-ia-api.onrender.com/api/checkout/webhook` (usa tu URL de Render)
4. **Events:** selecciona solo `checkout.session.completed`
5. Click "Add Endpoint"
6. **Copia el "Signing secret"** (empieza con `whsec_`)

---

## PASO 5: Actualiza STRIPE_WEBHOOK_SECRET en Render

1. Vuelve a Render → servicio `curso-ia-api` → Environment
2. Edita `STRIPE_WEBHOOK_SECRET`:
   - Pega el secret que copiaste de Stripe
3. Click "Save"
4. **Render redeploy automático** (verás "Deploying...")

---

## PASO 6: Deploy Frontend en Vercel

1. Ve a https://vercel.com
2. Click "Add New..." → "Project"
3. Selecciona `CURSO-ONLINE-REPLIT` (en GitHub)
4. Click "Import"
5. En "Root Directory": selecciona `artifacts/logoped-ia`
6. En "Environment Variables": añade:

```
VITE_API_BASE_URL = https://curso-ia-api.onrender.com (tu URL de Render)
```

7. Click "Deploy"
8. **Espera 2-3 min** a que termine

---

## PASO 7: Actualiza PUBLIC_APP_URL en Render

Una vez que Vercel te da tu URL (ej: `https://curso-ia-web.vercel.app`):

1. Vuelve a Render → servicio `curso-ia-api` → Environment
2. Edita `PUBLIC_APP_URL`:
   - Pega tu URL de Vercel
3. Click "Save"
4. **Render redeploy automático**

---

## ✅ VERIFICACIÓN FINAL

Abre https://curso-ia-web.vercel.app y comprueba:

- [ ] La página carga (ves "Inteligencia artificial aplicada de verdad...")
- [ ] Ves "20 plazas" y "49€"
- [ ] Click "Reservar" → formulario aparece
- [ ] Rellena: nombre, email, profesión
- [ ] Click "Ir al pago" → abre Stripe (test card: 4242 4242 4242 4242)
- [ ] Después del pago → te redirige a `/gracias`
- [ ] Email a `ia.logoped.ia0@gmail.com` (revisa spam)
- [ ] Entra a `/admin` con la clave `mk-admin-2026-curso-ia`
- [ ] Ves "1 inscripción" en el panel

**Si algo falla:**
- Revisa los logs en Render (servicio → "Logs")
- Revisa los logs en Vercel (build/runtime)

---

## 🚨 IMPORTANTE

- **Render free tier:** 750 horas/mes (suficiente para ≈24/7)
- **No duerme** como otros servicios
- **Stripe test vs live:** usa `sk_test_...` por ahora
- Cuando vayas a producción, pasa a `sk_live_...` (en Stripe Dashboard)

---

**¿Preguntas? Avísame cuando termines cada paso.**
