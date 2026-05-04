import React, { useEffect, useState } from "react";
import { useGetCourseInfo, useCreateCheckout } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

/* ─── Schema ─────────────────────────────────────────────────────────── */
const checkoutSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
  profession: z.string().optional(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
});
type CheckoutFormValues = z.infer<typeof checkoutSchema>;

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function euros(n: number | string) {
  return `${n} €`;
}

/* ─── GDPR Consent ────────────────────────────────────────────────────── */
function GdprConsent({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <label className="form-consent" style={{ alignItems: "flex-start", gap: 10 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <span>
        He leído y acepto el tratamiento de mis datos para gestionar mi inscripción y recibir comunicaciones del curso.{" "}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{ color: "var(--green)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit", textDecoration: "underline" }}
        >
          {expanded ? "Ocultar información" : "+ Información sobre privacidad"}
        </button>
        {expanded && (
          <span style={{ display: "block", marginTop: 8, fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--fg)" }}>Responsable:</strong> José Aserraf Cohen · ia.logoped.ia0@gmail.com<br />
            <strong style={{ color: "var(--fg)" }}>Finalidad:</strong> Gestión de la inscripción al curso y comunicaciones relacionadas (enlace de acceso, documentación, avisos del curso).<br />
            <strong style={{ color: "var(--fg)" }}>Legitimación:</strong> Ejecución del contrato (art. 6.1.b RGPD) y consentimiento para comunicaciones (art. 6.1.a RGPD).<br />
            <strong style={{ color: "var(--fg)" }}>Destinatarios:</strong> Datos no cedidos a terceros salvo obligación legal. Procesador de pagos: Stripe, Inc. (transferencia internacional con cláusulas contractuales estándar).<br />
            <strong style={{ color: "var(--fg)" }}>Conservación:</strong> Durante la relación contractual y 5 años posteriores a efectos fiscales y legales.<br />
            <strong style={{ color: "var(--fg)" }}>Derechos:</strong> Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación escribiendo a ia.logoped.ia0@gmail.com con asunto "RGPD".<br />
            <strong style={{ color: "var(--fg)" }}>Reclamaciones:</strong> Puedes presentar reclamación ante la Agencia Española de Protección de Datos (aepd.es).
          </span>
        )}
      </span>
    </label>
  );
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function Home() {
  const { data: courseInfo, isLoading } = useGetCourseInfo();
  const createCheckout = useCreateCheckout();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", email: "", phone: "", profession: "", gdprConsent: false },
  });

  /* Inject Google Fonts */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  function onSubmit(data: CheckoutFormValues) {
    createCheckout.mutate(
      {
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          profession: data.profession,
          gdprConsent: data.gdprConsent,
        },
      },
      {
        onSuccess: (result) => {
          if (result.url) window.location.href = result.url;
        },
      }
    );
  }

  const TOTAL_CAPACITY = 20;
  const REFERENCE_PRICE = 99;
  const seatsLeft = courseInfo?.presaleSpotsLeft ?? 10;
  const currentPrice = courseInfo?.currentPrice ?? 49;
  const regularPrice = courseInfo?.regularPrice ?? 79;
  const totalEnrolled = courseInfo?.totalEnrolled ?? 0;
  const isSoldOut = totalEnrolled >= TOTAL_CAPACITY;

  return (
    <>
      {/* ── Global styles ─────────────────────────────────────────────── */}
      <style>{`
        :root {
          --green: #1A9B58;
          --green-l: #22C55E;
          --ink: #0F0C08;
          --bg: #FAFAF7;
          --muted: #6B7280;
          --border: #E5E3DC;
        }
        .lp * { box-sizing: border-box; }
        .lp {
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          background: var(--bg);
          color: var(--ink);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        .lp h1, .lp h2, .lp h3, .lp .serif {
          font-family: 'Lora', Georgia, serif;
        }

        /* ── Announce bar ── */
        .announce {
          background: var(--ink);
          color: #fff;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 10px 20px;
        }
        .announce strong { color: var(--green-l); }

        /* ── Header ── */
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 48px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .lp-logo { height: 64px; width: auto; border-radius: 10px; }
        .lp-nav { display: flex; gap: 32px; }
        .lp-nav a {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ink);
          text-decoration: none;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .lp-nav a:hover { opacity: 1; }

        /* ── Hero ── */
        .hero {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 64px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px;
          align-items: start;
        }
        .hero-pre {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 20px;
        }
        .hero h1 {
          font-size: clamp(2.4rem, 4.5vw, 3.6rem);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 28px;
          color: var(--ink);
        }
        .hero h1 em {
          font-style: italic;
          color: var(--green);
        }
        .hero-sub {
          font-size: 1.1rem;
          color: var(--muted);
          max-width: 520px;
          margin-bottom: 36px;
          line-height: 1.7;
        }
        .hero-stats {
          display: flex;
          gap: 36px;
          padding-top: 36px;
          border-top: 1px solid var(--border);
          margin-top: 20px;
        }
        .stat-num {
          font-family: 'Lora', serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--green);
          line-height: 1;
        }
        .stat-label { font-size: 0.82rem; color: var(--muted); margin-top: 4px; }

        /* ── Offer card ── */
        .offer-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 36px 32px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.07);
          position: sticky;
          top: 100px;
        }
        .offer-card-title {
          font-family: 'Lora', serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin-bottom: 24px;
          color: var(--ink);
        }
        .tiers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .tier {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px 16px;
          text-align: center;
        }
        .tier--active {
          border-color: var(--green);
          background: rgba(26,155,88,0.04);
        }
        .tier-badge {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 6px;
        }
        .tier--next .tier-badge { color: var(--muted); }
        .tier-label { font-size: 0.78rem; color: var(--muted); margin-bottom: 6px; }
        .tier-price {
          font-family: 'Lora', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
        }
        .tier--active .tier-price { color: var(--green); }
        .tier--next .tier-price { color: var(--muted); }
        .offer-close-note {
          font-size: 0.78rem;
          color: var(--muted);
          text-align: center;
          margin-bottom: 20px;
          padding: 10px;
          background: #F5F5F0;
          border-radius: 8px;
          letter-spacing: 0.01em;
        }
        .seats-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .seats-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--green);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .cta-btn {
          display: block;
          width: 100%;
          padding: 16px;
          background: var(--green);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Manrope', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          text-align: center;
          text-decoration: none;
        }
        .cta-btn:hover { background: #168a4d; transform: translateY(-1px); }
        .cta-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .cta-sub {
          font-size: 0.75rem;
          color: var(--muted);
          text-align: center;
          margin-top: 10px;
        }

        /* ── Section base ── */
        .section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 48px;
        }
        .section-tag {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 16px;
        }
        .section h2 {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 300;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 40px;
          max-width: 680px;
        }
        .section h2 em { font-style: italic; color: var(--green); }

        /* ── For-who ── */
        .fw-list { list-style: none; padding: 0; margin: 0; }
        .fw-item {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid var(--border);
          font-size: 1.05rem;
          line-height: 1.5;
        }
        .fw-item:last-child { border-bottom: none; }
        .fw-sep {
          font-family: 'Lora', serif;
          color: var(--green);
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        /* ── Outcomes grid ── */
        .outcomes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .outcome-item {
          padding: 36px 32px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .outcome-item:nth-child(even) { border-right: none; }
        .outcome-item:nth-child(3),
        .outcome-item:nth-child(4) { border-bottom: none; }
        .outcome-num {
          font-family: 'Lora', serif;
          font-size: 2.4rem;
          font-weight: 300;
          color: var(--green);
          line-height: 1;
          margin-bottom: 12px;
        }
        .outcome-title {
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 1rem;
        }
        .outcome-text { color: var(--muted); font-size: 0.9rem; line-height: 1.6; }

        /* ── Program ── */
        .program-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .session-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
        }
        .session-num {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 12px;
        }
        .session-title {
          font-family: 'Lora', serif;
          font-size: 1.3rem;
          font-weight: 400;
          margin-bottom: 8px;
        }
        .session-date { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; }
        .session-list { list-style: none; padding: 0; margin: 0; }
        .session-list li {
          font-size: 0.9rem;
          color: var(--muted);
          padding: 6px 0;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 10px;
        }
        .session-list li:last-child { border-bottom: none; }
        .session-list li::before { content: "—"; color: var(--green); flex-shrink: 0; }

        /* ── Instructor ── */
        .instructor-wrap {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 64px;
          align-items: start;
        }
        .instructor-photo {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 16px;
          object-fit: cover;
          border: 3px solid var(--green-l);
        }
        .instructor-name {
          font-family: 'Lora', serif;
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 6px;
        }
        .instructor-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--green);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .instructor-bio {
          font-size: 1rem;
          color: var(--muted);
          line-height: 1.75;
          margin-bottom: 24px;
        }
        .instructor-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 4px 12px;
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--ink);
          background: #fff;
        }

        /* ── Close strip ── */
        .close-strip {
          background: var(--ink);
          color: #fff;
          padding: 40px 48px;
        }
        .close-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }
        .close-text {
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 700px;
        }
        .close-text strong { color: var(--green-l); }
        .close-cta {
          flex-shrink: 0;
          padding: 14px 28px;
          background: var(--green);
          color: #fff;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
          font-size: 0.95rem;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .close-cta:hover { background: var(--green-l); }

        /* ── Reservation section ── */
        .reserve-section {
          max-width: 600px;
          margin: 0 auto;
          padding: 80px 48px;
        }
        .reserve-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 32px;
        }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 0.85rem; font-weight: 600; }
        .form-input {
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-family: 'Manrope', sans-serif;
          font-size: 0.95rem;
          background: #fff;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input:focus { border-color: var(--green); }
        .form-consent { display: flex; gap: 12px; align-items: flex-start; font-size: 0.82rem; color: var(--muted); }
        .form-consent input { margin-top: 3px; flex-shrink: 0; }

        /* ── Footer ── */
        .lp-footer {
          border-top: 1px solid var(--border);
          padding: 32px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--muted);
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; padding: 60px 32px; }
          .offer-card { position: static; }
          .outcomes-grid { grid-template-columns: 1fr; }
          .outcome-item:nth-child(even) { border-right: 1px solid var(--border); }
          .outcome-item:nth-child(3) { border-bottom: 1px solid var(--border); }
          .instructor-wrap { grid-template-columns: 1fr; }
          .instructor-photo { max-width: 200px; }
          .program-grid { grid-template-columns: 1fr; }
          .close-inner { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 768px) {
          .lp-header { padding: 16px 24px; }
          .lp-nav { display: none; }
          .section { padding: 60px 24px; }
          .reserve-section { padding: 60px 24px; }
          .close-strip { padding: 32px 24px; }
          .lp-footer { padding: 24px; flex-direction: column; gap: 12px; text-align: center; }
          .tiers { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="lp">

        {/* ── Announce bar ──────────────────────────────────────────── */}
        <div className="announce">
          {isSoldOut ? (
            <>Curso <strong>completo</strong>&nbsp;&nbsp;·&nbsp;&nbsp;20 plazas cerradas · No se amplían</>
          ) : (
            <>Tramo 1: <strong>10 plazas × {currentPrice} €</strong>&nbsp;&nbsp;·&nbsp;&nbsp;
            Tramo 2: <strong>10 plazas × {regularPrice} €</strong>&nbsp;&nbsp;·&nbsp;&nbsp;
            Sin grabación · Se cierra cuando se llena</>
          )}
        </div>

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="lp-header">
          <img src="/logo-matrix.png" alt="Logoped-IA" className="lp-logo" />
          <nav className="lp-nav">
            <a href="#programa">Programa</a>
            <a href="#instructor">Instructor</a>
            <a href="#reserva">Reservar</a>
          </nav>
        </header>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-left">
            <p className="hero-pre">Curso en directo · Junio 2026 · 2 sesiones · 20 plazas</p>
            <h1>
              Inteligencia artificial<br />
              <em>aplicada de verdad</em><br />
              a tu práctica clínica
            </h1>
            <p className="hero-sub">
              No es hype. No es teoría de Silicon Valley. Es lo que llevo
              dos años destilando desde la consulta, con criterio clínico
              y sin perder de vista al paciente.
            </p>
            <a href="#reserva" className="cta-btn" style={{ display: "inline-block", width: "auto", padding: "16px 40px" }}>
              {isSoldOut ? "Lista de espera" : `Reservar mi plaza — ${euros(currentPrice)}`}
            </a>
            <div className="hero-stats">
              <div>
                <div className="stat-num">18+</div>
                <div className="stat-label">años ejerciendo logopedia</div>
              </div>
              <div>
                <div className="stat-num">2</div>
                <div className="stat-label">años con IA en consulta</div>
              </div>
              <div>
                <div className="stat-num">20</div>
                <div className="stat-label">plazas en total</div>
              </div>
            </div>
          </div>

          {/* ── Offer card ── */}
          <aside className="offer-card">
            <p className="offer-card-title">Precio de preventa</p>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Loader2 style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: "var(--green)", margin: "0 auto" }} />
              </div>
            ) : (
              <>
                <div className="tiers" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <div className={`tier ${courseInfo?.isPresale ? "tier--active" : ""}`}>
                    <div className="tier-badge">Tramo 1 {courseInfo?.isPresale ? "· Activo" : "· Cerrado"}</div>
                    <div className="tier-label">10 plazas</div>
                    <div className="tier-price">{euros(currentPrice)}</div>
                  </div>
                  <div className="tier tier--next">
                    <div className="tier-badge">Tramo 2 · Próximo</div>
                    <div className="tier-label">10 plazas</div>
                    <div className="tier-price">{euros(regularPrice)}</div>
                  </div>
                  <div className="tier" style={{ opacity: 0.5 }}>
                    <div className="tier-badge" style={{ color: "var(--muted)" }}>Academia</div>
                    <div className="tier-label">Futuras ediciones</div>
                    <div className="tier-price" style={{ textDecoration: "line-through", fontSize: "1.3rem" }}>{euros(REFERENCE_PRICE)}</div>
                  </div>
                </div>
                <p className="offer-close-note">
                  Sin grabación · Sin segunda edición<br />
                  Cuando se completa, se cierra. No se amplían plazas.
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--green)", fontWeight: 600, textAlign: "center", marginBottom: 16 }}>
                  Este formato en directo no se volverá a ofrecer a este precio
                </p>
                {isSoldOut ? (
                  <>
                    <div style={{ background: "#111", color: "#fff", borderRadius: 10, padding: "14px 16px", textAlign: "center", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em", marginBottom: 10 }}>
                      TODAS LAS PLAZAS COMPLETAS
                    </div>
                    <a href="#reserva" className="cta-btn" style={{ background: "var(--muted)" }}>
                      Entrar en lista de espera
                    </a>
                  </>
                ) : (
                  <>
                    <div className="seats-indicator">
                      <span className="seats-dot"></span>
                      <span>{TOTAL_CAPACITY - totalEnrolled} plazas disponibles ahora mismo</span>
                    </div>
                    <a href="#reserva" className="cta-btn">
                      Reservar mi plaza
                    </a>
                    <p className="cta-sub">Pago directo para confirmar plaza</p>
                  </>
                )}
              </>
            )}
          </aside>
        </section>

        {/* ── Para quién ───────────────────────────────────────────── */}
        <section className="section" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="section-tag">Para quién es</p>
          <h2>Este curso es para ti si <em>ya trabajas</em><br />y quieres trabajar mejor</h2>
          <ul className="fw-list">
            {[
              "Eres logopeda, maestro, psicólogo o profesional de ayuda con consulta real o contexto educativo",
              "Ya oíste hablar de ChatGPT y no sabes si sirve para algo concreto en tu día a día",
              "Quieres ahorrar tiempo en informes, materiales y planificación sin perder criterio clínico",
              "Buscas un formador que hable desde la práctica, no desde el PowerPoint de turno",
              "No necesitas más hype: necesitas ver cómo funciona en casos reales",
            ].map((item, i) => (
              <li key={i} className="fw-item">
                <span className="fw-sep">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Outcomes ─────────────────────────────────────────────── */}
        <section className="section" style={{ background: "#F5F4F0", paddingTop: 80, paddingBottom: 80, maxWidth: "100%" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
            <p className="section-tag">Qué vas a conseguir</p>
            <h2>Al terminar, la IA <em>ya no es</em><br />una caja negra para ti</h2>
            <div className="outcomes-grid">
              {[
                {
                  num: "01",
                  title: "Criterio propio",
                  text: "Sabrás distinguir qué herramientas tienen valor real y cuáles son ruido. No necesitarás esperar a que alguien más lo evalúe por ti.",
                },
                {
                  num: "02",
                  title: "Menos tiempo en burocracia",
                  text: "Informes, sesiones, materiales: sabrás automatizar sin perder tu voz clínica ni la calidad del resultado.",
                },
                {
                  num: "03",
                  title: "Herramientas que ya funcionan",
                  text: "Saldrás con un conjunto de flujos de trabajo testados en consulta real, no promesas de laboratorio.",
                },
                {
                  num: "04",
                  title: "Posicionamiento profesional",
                  text: "La IA en salud está llegando. Los que la integren antes con criterio marcarán la diferencia frente a los que esperen.",
                },
              ].map((o) => (
                <div key={o.num} className="outcome-item">
                  <div className="outcome-num">{o.num}</div>
                  <div className="outcome-title">{o.title}</div>
                  <p className="outcome-text">{o.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Programa ─────────────────────────────────────────────── */}
        <section className="section" id="programa">
          <p className="section-tag">El programa</p>
          <h2>Dos sesiones en directo.<br /><em>Sin relleno.</em></h2>
          <div className="program-grid">
            <div className="session-card">
              <p className="session-num">Sesión 01</p>
              <h3 className="session-title">El mapa: IA aplicada a la clínica</h3>
              <p className="session-date">23 de junio de 2026 · 90 min · En directo</p>
              <ul className="session-list">
                <li>Qué son los modelos de lenguaje y cómo hablarles bien</li>
                <li>Flujos reales para evaluación y planificación</li>
                <li>Automatización de informes clínicos con criterio</li>
                <li>Límites éticos: privacidad, sesgo y responsabilidad</li>
              </ul>
            </div>
            <div className="session-card">
              <p className="session-num">Sesión 02</p>
              <h3 className="session-title">El taller: tu flujo de trabajo con IA</h3>
              <p className="session-date">30 de junio de 2026 · 90 min · En directo</p>
              <ul className="session-list">
                <li>Construcción de materiales clínicos personalizados</li>
                <li>IA para educación: programaciones, adaptaciones y feedback</li>
                <li>Herramientas sin código: videojuegos e interactivos para la clínica</li>
                <li>Sesión práctica: casos reales con los asistentes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Close strip ──────────────────────────────────────────── */}
        <div className="close-strip">
          <div className="close-inner">
            <p className="close-text">
              <strong>Sin grabación. Sin segunda edición.</strong> 20 plazas en total,
              dos tramos de precio. Cuando se llena, se cierra. No se amplían plazas. El material queda
              reservado para la academia. No hay segunda oportunidad de entrar a este precio.
            </p>
            {isSoldOut ? (
              <a href="#reserva" className="close-cta" style={{ background: "var(--muted)" }}>Lista de espera</a>
            ) : (
              <a href="#reserva" className="close-cta">Reservar mi plaza</a>
            )}
          </div>
        </div>

        {/* ── Instructor ───────────────────────────────────────────── */}
        <section className="section" id="instructor">
          <div className="instructor-wrap">
            <div>
              <img src="/foto-jose.jpg" alt="José Aserraf" className="instructor-photo" />
            </div>
            <div>
              <p className="section-tag">El instructor</p>
              <h2 className="instructor-name">José Aserraf Cohen</h2>
              <p className="instructor-title">Logopeda clínico · Fundador de Logoped-IA · Presidente de ASMEL</p>
              <p className="instructor-bio">
                Llevo más de 18 años trabajando como logopeda clínico. No vengo del mundo
                tecnológico: vengo de la consulta. Eso es precisamente lo que diferencia este
                curso de la mayoría.
              </p>
              <p className="instructor-bio">
                Llevo dos años integrando IA de forma intensa en mi práctica clínica — evaluaciones,
                materiales, informes, planificación de tratamientos — y he desarrollado criterio real
                sobre qué funciona y qué es ruido. He formado a profesionales en más de cinco
                universidades y publicado seis libros sobre logopedia y tecnología educativa.
              </p>
              <p className="instructor-bio">
                Este curso no existe en ningún otro sitio porque nadie más lo ha vivido desde dentro.
              </p>
              <div className="instructor-tags">
                {["18+ años de clínica", "6 libros publicados", "Docencia universitaria", "Presidente ASMEL", "Fönia · Logoped-IA", "IA en consulta desde 2023"].map(t => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Reserve form ─────────────────────────────────────────── */}
        <section id="reserva" className="reserve-section">
          {isSoldOut ? (
            <>
              <p className="section-tag" style={{ textAlign: "center" }}>Acceso cerrado</p>
              <h2 style={{ textAlign: "center", maxWidth: "100%", marginBottom: 16 }}>
                <em>Todas las plazas</em><br />completadas
              </h2>
              <div style={{ background: "#111", color: "#fff", borderRadius: 12, padding: "24px 28px", textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.05em", marginBottom: 8 }}>
                  TODAS LAS PLAZAS COMPLETAS
                </p>
                <p style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  Las 20 plazas se han cerrado. No se abrirán más ni se repetirá este formato.
                </p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="reserve-form">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Nombre completo</FormLabel>
                      <FormControl>
                        <input className="form-input" placeholder="Tu nombre" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Correo electrónico</FormLabel>
                      <FormControl>
                        <input type="email" className="form-input" placeholder="tu@email.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <button type="submit" className="cta-btn" disabled={createCheckout.isPending} data-testid="button-submit-checkout" style={{ marginTop: 8, background: "var(--muted)" }}>
                    {createCheckout.isPending && <Loader2 style={{ width: 18, height: 18, display: "inline", marginRight: 8, animation: "spin 1s linear infinite" }} />}
                    Entrar en lista de espera
                  </button>
                  <p className="cta-sub">Solo para profesionales que realmente querían entrar y se han quedado fuera. Prioridad para lo próximo (no será igual).</p>
                </form>
              </Form>
            </>
          ) : (
            <>
              <p className="section-tag" style={{ textAlign: "center" }}>Reserva tu plaza</p>
              <h2 style={{ textAlign: "center", maxWidth: "100%", marginBottom: 8 }}>
                Tramo 1 · <em>{euros(currentPrice)}</em>
              </h2>
              <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: 32, fontSize: "0.9rem" }}>
                Pago directo para confirmar plaza · {seatsLeft} plazas disponibles
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="reserve-form">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Nombre completo</FormLabel>
                      <FormControl>
                        <input className="form-input" placeholder="Tu nombre" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Correo electrónico</FormLabel>
                      <FormControl>
                        <input type="email" className="form-input" placeholder="tu@email.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="profession" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Profesión</FormLabel>
                      <FormControl>
                        <input className="form-input" placeholder="Logopeda, maestro, psicólogo..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">WhatsApp (opcional)</FormLabel>
                      <FormControl>
                        <input className="form-input" placeholder="+34 600 000 000" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="gdprConsent" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <GdprConsent checked={Boolean(field.value)} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <button type="submit" className="cta-btn" disabled={createCheckout.isPending} data-testid="button-submit-checkout" style={{ marginTop: 8 }}>
                    {createCheckout.isPending && <Loader2 style={{ width: 18, height: 18, display: "inline", marginRight: 8, animation: "spin 1s linear infinite" }} />}
                    Confirmar plaza e ir al pago
                  </button>
                  <p className="cta-sub">20 plazas totales · Precio sube en Tramo 2 a {regularPrice} €</p>
                </form>
              </Form>
            </>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <img src="/logo-matrix.png" alt="Logoped-IA" style={{ height: 36, borderRadius: 8 }} />
          <span>© {new Date().getFullYear()} Logoped-IA · José Aserraf Cohen</span>
          <a href="/admin" style={{ color: "var(--muted)", textDecoration: "underline", fontSize: "0.78rem" }} data-testid="link-admin">
            Admin
          </a>
        </footer>
      </div>
    </>
  );
}
