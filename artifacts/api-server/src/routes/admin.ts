import { Router } from "express";
import { db, enrollmentsTable } from "@workspace/db";
import { eq, sum, count, sql } from "drizzle-orm";
import { sendEmail, buildConfirmationEmail, buildBroadcastEmail } from "../lib/email";
import {
  AdminGetEnrollmentsHeader,
  AdminGetStatsHeader,
  AdminResendEmailParams,
  AdminResendEmailHeader,
} from "@workspace/api-zod";

const PRESALE_SPOTS = 10;
const COURSE_NAME = "Logopedia con IA: Tu primer curso online";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "logoped-ia-admin-2026";

const router = Router();

router.get("/admin/enrollments", async (req, res) => {
  const parsed = AdminGetEnrollmentsHeader.safeParse(req.headers);
  if (!parsed.success || parsed.data["x-admin-secret"] !== ADMIN_SECRET) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  try {
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .orderBy(sql`${enrollmentsTable.createdAt} DESC`);

    res.json(
      enrollments.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        phone: e.phone ?? undefined,
        pricePaid: Number(e.pricePaid),
        isPresale: e.isPresale,
        status: e.status,
        stripeSessionId: e.stripeSessionId ?? undefined,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Error listing enrollments");
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
});

router.get("/admin/stats", async (req, res) => {
  const parsed = AdminGetStatsHeader.safeParse(req.headers);
  if (!parsed.success || parsed.data["x-admin-secret"] !== ADMIN_SECRET) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  try {
    const rows = await db
      .select({
        isPresale: enrollmentsTable.isPresale,
        status: enrollmentsTable.status,
        totalRevenue: sum(enrollmentsTable.pricePaid),
        count: count(),
      })
      .from(enrollmentsTable)
      .groupBy(enrollmentsTable.isPresale, enrollmentsTable.status);

    let totalEnrolled = 0;
    let presaleCount = 0;
    let regularCount = 0;
    let totalRevenue = 0;
    let presaleRevenue = 0;
    let regularRevenue = 0;
    let pendingCount = 0;
    let presaleSpotsUsed = 0;

    for (const row of rows) {
      const n = Number(row.count);
      const rev = Number(row.totalRevenue ?? 0);
      if (row.status === "completed") {
        totalEnrolled += n;
        totalRevenue += rev;
        if (row.isPresale) {
          presaleCount += n;
          presaleRevenue += rev;
          presaleSpotsUsed += n;
        } else {
          regularCount += n;
          regularRevenue += rev;
        }
      } else if (row.status === "pending") {
        pendingCount += n;
      }
    }

    res.json({
      totalEnrolled,
      presaleCount,
      regularCount,
      totalRevenue,
      presaleRevenue,
      regularRevenue,
      presaleSpotsLeft: Math.max(0, PRESALE_SPOTS - presaleSpotsUsed),
      pendingCount,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting stats");
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.post("/admin/enrollments/:id/resend-email", async (req, res) => {
  const paramsParsed = AdminResendEmailParams.safeParse(req.params);
  const headerParsed = AdminResendEmailHeader.safeParse(req.headers);

  if (
    !headerParsed.success ||
    headerParsed.data["x-admin-secret"] !== ADMIN_SECRET
  ) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  if (!paramsParsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const { id } = paramsParsed.data;

  try {
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, id));

    if (!enrollment) {
      res.status(404).json({ error: "Inscripción no encontrada" });
      return;
    }

    const html = buildConfirmationEmail({
      name: enrollment.name,
      email: enrollment.email,
      pricePaid: Number(enrollment.pricePaid),
      isPresale: enrollment.isPresale,
      courseName: COURSE_NAME,
    });

    const sent = await sendEmail({
      to: enrollment.email,
      subject: `Confirmación de inscripción — ${COURSE_NAME}`,
      html,
    });

    if (sent) {
      await db
        .update(enrollmentsTable)
        .set({ emailSent: true })
        .where(eq(enrollmentsTable.id, enrollment.id));
    }

    res.json({
      success: sent,
      message: sent ? "Email enviado correctamente" : "Error al enviar el email",
    });
  } catch (err) {
    req.log.error({ err }, "Error resending email");
    res.status(500).json({ error: "Error al reenviar el email" });
  }
});

router.post("/admin/broadcast", async (req, res) => {
  const headerParsed = AdminResendEmailHeader.safeParse(req.headers);
  if (!headerParsed.success || headerParsed.data["x-admin-secret"] !== ADMIN_SECRET) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const { subject, bodyHtml, dryRun } = req.body as {
    subject?: string;
    bodyHtml?: string;
    dryRun?: boolean;
  };

  if (!subject || !bodyHtml) {
    res.status(400).json({ error: "Faltan campos: subject, bodyHtml" });
    return;
  }

  try {
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.status, "completed"));

    if (dryRun) {
      res.json({
        dryRun: true,
        total: enrollments.length,
        recipients: enrollments.map(e => ({ name: e.name, email: e.email })),
      });
      return;
    }

    let sent = 0;
    let failed = 0;
    const results: { name: string; email: string; ok: boolean }[] = [];

    for (const enrollment of enrollments) {
      const html = buildBroadcastEmail({ name: enrollment.name, bodyHtml });
      const ok = await sendEmail({ to: enrollment.email, subject, html });
      if (ok) sent++;
      else failed++;
      results.push({ name: enrollment.name, email: enrollment.email, ok });
      await new Promise(r => setTimeout(r, 300));
    }

    req.log.info({ sent, failed, total: enrollments.length }, "Broadcast sent");
    res.json({ sent, failed, total: enrollments.length, results });
  } catch (err) {
    req.log.error({ err }, "Error sending broadcast");
    res.status(500).json({ error: "Error al enviar el broadcast" });
  }
});

router.post("/admin/test-email", async (req, res) => {
  const headerParsed = AdminResendEmailHeader.safeParse(req.headers);
  if (!headerParsed.success || headerParsed.data["x-admin-secret"] !== ADMIN_SECRET) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const to = (req.body as { to?: string }).to;
  if (!to) { res.status(400).json({ error: "Falta campo 'to'" }); return; }

  try {
    const { ReplitConnectors } = await import("@replit/connectors-sdk");
    const connectors = new ReplitConnectors();

    const profileRes = await connectors.proxy("google-mail", "/gmail/v1/users/me/profile", { method: "GET" });
    const profile = await profileRes.json() as { emailAddress?: string };
    const from = `Logoped-IA <${profile.emailAddress}>`;

    const html = buildConfirmationEmail({
      name: "Alumno de prueba",
      email: to,
      pricePaid: 39,
      isPresale: true,
      courseName: COURSE_NAME,
    });

    const sent = await sendEmail({ to, subject: `Confirmación de inscripción — ${COURSE_NAME}`, html });
    res.json({ success: sent, from: profile.emailAddress, to });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/admin/check-gmail-message/:msgId", async (req, res) => {
  const headerParsed = AdminResendEmailHeader.safeParse(req.headers);
  if (!headerParsed.success || headerParsed.data["x-admin-secret"] !== ADMIN_SECRET) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const { ReplitConnectors } = await import("@replit/connectors-sdk");
    const connectors = new ReplitConnectors();
    const r = await connectors.proxy("google-mail", `/gmail/v1/users/me/messages/${req.params.msgId}?format=metadata&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=From`, { method: "GET" });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
