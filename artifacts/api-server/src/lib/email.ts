// Email sending priority: Brevo → Resend → Gmail
// Brevo: set BREVO_API_KEY (best deliverability, no domain verification needed)
// Resend: set RESEND_API_KEY (requires verified domain for non-owner recipients)
// Gmail: Replit OAuth connector (fallback, limited Hotmail deliverability)

import { logger } from "./logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Encode a header value with non-ASCII characters using RFC 2047
function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

// Build a base64url-encoded RFC 2822 message for Gmail API
// Subject uses RFC 2047 encoding; HTML body uses base64 transfer encoding
function buildRfc2822Message(opts: {
  to: string;
  from: string;
  subject: string;
  html: string;
}): string {
  const { to, from, subject, html } = opts;
  const boundary = "boundary_logoped_ia_" + Date.now();
  const encodedSubject = encodeHeader(subject);
  const encodedHtml = Buffer.from(html, "utf8").toString("base64");

  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodedHtml,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  // base64url encode (no padding, url-safe)
  return Buffer.from(lines).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendViaGmail(options: EmailOptions): Promise<boolean> {
  try {
    const { ReplitConnectors } = await import("@replit/connectors-sdk");
    const connectors = new ReplitConnectors();

    // Get sender address from Gmail profile
    const profileResponse = await connectors.proxy("google-mail", "/gmail/v1/users/me/profile", {
      method: "GET",
    });
    const profile = await profileResponse.json() as { emailAddress?: string };
    const senderEmail = profile.emailAddress ?? "me";
    const from = options.from ?? `Logoped-IA <${senderEmail}>`;

    const raw = buildRfc2822Message({
      to: options.to,
      from,
      subject: options.subject,
      html: options.html,
    });

    const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });

    const result = await response.json() as { id?: string; error?: unknown };

    if (!result.id) {
      logger.error({ result }, "Gmail send failed");
      return false;
    }

    logger.info({ to: options.to, messageId: result.id }, "Email sent via Gmail");
    return true;
  } catch (err) {
    logger.error({ err }, "Error sending email via Gmail");
    return false;
  }
}

function resolveBrevoKey(): string | undefined {
  let key = process.env.BREVO_API_KEY;
  if (!key) return undefined;
  // If the stored value is base64-encoded JSON (e.g. {"api_key":"xkeysib-..."}), decode it
  if (!key.startsWith("xkeysib-") && !key.startsWith("xsmtpsib-")) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      const inner = parsed.api_key ?? parsed.apiKey;
      if (typeof inner === "string") key = inner;
    } catch { /* not base64 JSON, use as-is */ }
  }
  return key;
}

async function sendViaBrevo(options: EmailOptions): Promise<boolean> {
  const apiKey = resolveBrevoKey();
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Logoped-IA", email: "ia.logoped.ia0@gmail.com" },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "(sin cuerpo)");
      logger.error({ status: response.status, body }, "Brevo API error");
      return false;
    }

    logger.info({ to: options.to }, "Email sent via Brevo");
    return true;
  } catch (err) {
    logger.error({ err }, "Error sending email via Brevo");
    return false;
  }
}

async function sendViaResend(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from ?? "Logoped-IA <onboarding@resend.dev>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "(sin cuerpo)");
      logger.error({ status: response.status, body }, "Resend API error");
      return false;
    }

    logger.info({ to: options.to }, "Email sent via Resend");
    return true;
  } catch (err) {
    logger.error({ err }, "Error sending email via Resend");
    return false;
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // 1. Brevo — own verified domain brevosend.com, passes SPF/DKIM/DMARC
  if (process.env.BREVO_API_KEY) {
    const brevoOk = await sendViaBrevo(options);
    if (brevoOk) return true;
  }

  // 2. Gmail — fallback
  const gmailOk = await sendViaGmail(options);
  if (gmailOk) return true;

  // 3. Resend — requires verified domain
  if (process.env.RESEND_API_KEY) {
    const resendOk = await sendViaResend(options);
    if (resendOk) return true;
  }

  logger.warn({ to: options.to }, "No email provider available.");
  return false;
}

export function buildBroadcastEmail(params: {
  name: string;
  bodyHtml: string;
}): string {
  const { name, bodyHtml } = params;
  const personalizedBody = bodyHtml.replace(/\{\{nombre\}\}/gi, name);
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#0f1a11;padding:28px 40px;">
      <h1 style="color:#4ade80;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Logoped-IA</h1>
      <p style="color:rgba(255,255,255,.55);margin:4px 0 0;font-size:13px;">Curso en directo · Junio 2026</p>
    </div>
    <div style="padding:40px;color:#1f2937;line-height:1.7;font-size:15px;">
      ${personalizedBody}
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6;">
        Has recibido este correo por estar inscrito en Logoped-IA.<br/>
        Responsable: José Aserraf Cohen · <a href="mailto:ia.logoped.ia0@gmail.com" style="color:#9ca3af;">ia.logoped.ia0@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildConfirmationEmail(params: {
  name: string;
  email: string;
  pricePaid: number;
  isPresale: boolean;
  courseName: string;
}): string {
  const { name, pricePaid, isPresale, courseName } = params;
  const badge = isPresale
    ? `<span style="background:#4f46e5;color:#fff;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:600;">PRECIO PREVENTA</span>`
    : `<span style="background:#16a34a;color:#fff;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:600;">INSCRIPCION CONFIRMADA</span>`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmacion de inscripcion</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#e8612c,#c0441a);padding:40px 40px 32px;">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">Logoped-IA</h1>
      <p style="color:rgba(255,255,255,.80);margin:6px 0 0;font-size:14px;">Tu plataforma de logopedia con IA</p>
    </div>
    <div style="padding:40px;">
      <div style="margin-bottom:20px;">${badge}</div>
      <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Hola, ${name}!</h2>
      <p style="color:#374151;line-height:1.7;margin:0 0 24px;">
        Tu inscripcion en <strong>${courseName}</strong> ha sido confirmada. Estamos encantados de tenerte con nosotros.
      </p>
      <div style="background:#fff7f5;border:1px solid #fed7c3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <div style="margin-bottom:8px;">
          <span style="color:#7c3d1e;font-weight:600;font-size:14px;">Curso: </span>
          <span style="color:#111827;">${courseName}</span>
        </div>
        <div>
          <span style="color:#7c3d1e;font-weight:600;font-size:14px;">Precio pagado: </span>
          <span style="color:#111827;font-weight:700;font-size:18px;">€${pricePaid}</span>
        </div>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
        En breve recibiras toda la informacion de acceso al curso. Si tienes alguna duda, responde a este correo.
      </p>
      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;color:#065f46;font-size:14px;font-weight:500;">
          Tu plaza esta reservada y confirmada.
          ${isPresale ? " Has conseguido el precio especial de preventa." : ""}
        </p>
      </div>
    </div>
    <div style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        2026 Logoped-IA - Todos los derechos reservados
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
