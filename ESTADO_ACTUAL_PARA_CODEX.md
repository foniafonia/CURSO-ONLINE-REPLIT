# ESTADO ACTUAL DEL PROYECTO - Resumen para Codex

## ✅ QUÉ ESTÁ HECHO

### 1. Curso Preventa Local
- **Ruta:** `/Users/joseaserraf/Desktop/TODO PROYECTO LOGOPED IA VICTOR Y DEMAS/curso-ia-preventa/`
- **Estado:** FUNCIONAL en localhost:5088
- **Componentes:**
  - `index.html` (tiered pricing 49€/79€, "sin grabación" messaging)
  - `styles.css` (diseño editorial, Fraunces+Manrope, green branding)
  - `server.py` (Flask, SQLite local, precios actualizados)
  - `app.js` (form submission, Stripe integration)
  - `logo-matrix.png` (64px en header)
  - `foto-jose.jpg` (con círculo gradiente)

### 2. Repo GitHub (Monorepo)
- **URL:** https://github.com/foniafonia/CURSO-ONLINE-REPLIT
- **Estructura:**
  - `artifacts/api-server/` (Express backend)
  - `artifacts/logoped-ia/` (React frontend Vite)
  - `lib/` (shared types, Zod schemas)
  - `scripts/` (utilidades)
- **Archivos de deploy preparados:**
  - `render.yaml` (Blueprint para Render)
  - `fly.toml` (config para Fly.io)
  - `Dockerfile` (para Docker)
  - `DEPLOY_RENDER_VERCEL.md` (instrucciones Render)
  - `DEPLOY_FLY.md` (instrucciones Fly)
  - `.env.example` (template variables)

### 3. Rediseño React (Home_replit.tsx)
- **Ruta local:** `/Users/joseaserraf/Desktop/TODO PROYECTO LOGOPED IA VICTOR Y DEMAS/curso-ia-preventa/Home_replit.tsx`
- **Versión para Replit:** Componente React completo con:
  - Tipografía Fraunces + Manrope
  - Pricing tiered (Tramo 1: 49€ activo, Tramo 2: 79€ próximo)
  - Copy profesional ("sin grabación, sin segunda edición")
  - Bio de Jose (18+ años clínica, 2 años IA)
  - Form reserva + Stripe checkout
  - Panel admin (`/admin`)
  - Responsive design
- **Estado:** Listo para pegar en Replit `client/src/pages/Home.tsx`

### 4. Backend Code (Express)
- **Rutas principales:**
  - `POST /api/checkout` → crear sesión Stripe
  - `POST /api/checkout/webhook` → validar pago Stripe
  - `GET /api/course` → info del curso (plazas, precios, estado)
  - `GET /api/admin/stats` → estadísticas (requiere ADMIN_SECRET)
- **BD:** SQLite local (producción usa Postgres)
- **Stripe:** Integrado (test keys via env vars)
- **Emails:** Resend/SendGrid/Gmail (seleccionable por env var)

---

## ❌ LO QUE NO FUNCIONA / BLOQUEADO

### Deployment a la nube
El usuario intentó 4 opciones, todas bloqueadas por costo o tarjeta:
1. **Render** → pide tarjeta ($24.50/mes)
2. **Fly.io App + Managed Postgres** → pide tarjeta ($5 + $38 = $43/mes)
3. **Fly.io + Unmanaged Postgres** → gratis pero "not supported"
4. **Render Blueprint** → $24.50/mes

**Usuario rechazó todas por costo.**

---

## 🎯 DECISIÓN ACTUAL

**Usuario elige:** Vercel (frontend gratis) + Vercel Functions (backend serverless) + Supabase (BD gratis EU)

**Esto requiere:**
1. Convertir Express → Vercel Functions (refactor código)
   - `/api/checkout` → `api/checkout.ts` (Vercel Function)
   - `/api/checkout/webhook` → `api/checkout/webhook.ts`
   - `/api/course` → `api/course.ts`
   - `/api/admin/stats` → `api/admin/stats.ts`
2. Mover BD de SQLite/Postgres → Supabase (SQL compatible)
3. Actualizar variables de entorno
4. Deploy en Vercel

**Estimación:** 2-3 horas de refactor de código

---

## 📋 PRÓXIMOS PASOS (para Codex)

Si el usuario confirma:
1. [ ] Crear Vercel Functions equivalentes a rutas Express
2. [ ] Migrar queries SQL a Supabase (client)
3. [ ] Crear `vercel.json` con config de functions
4. [ ] Crear Supabase project (EU, sin tarjeta)
5. [ ] Actualizar frontend para usar VITE_API_BASE_URL
6. [ ] Deploy Vercel
7. [ ] Configurar webhook Stripe en Vercel domain
8. [ ] Testing completo

---

## 🔑 CREDENCIALES / CONFIG

- **Email:** ia.logoped.ia0@gmail.com
- **Stripe keys:** (usuario aún no compartió, solo los primeros 20 chars)
- **GitHub:** https://github.com/foniafonia/CURSO-ONLINE-REPLIT
- **Tarjeta Fly:** Borrada (usuario prefiere no usarla)

---

## 📝 NOTAS IMPORTANTES

- El usuario **no quiere pagar** ($25/mes o más)
- El usuario **quiere algo profesional** (no Gumroad)
- El usuario **rechazó Render/Fly/Teachable** por costo
- **Vercel + Supabase es la ÚNICA opción gratis viable** que se vio
- Requiere **refactor de código significativo** (Express → Serverless Functions)

---

## DECISIÓN PENDIENTE

**¿Procede con Vercel Functions (2-3 horas de trabajo)?**
- SÍ → Codex refactoriza el backend
- NO → Usar Render $25/mes (sin cambios de código)

**Usuario debe confirmar antes de continuar.**
