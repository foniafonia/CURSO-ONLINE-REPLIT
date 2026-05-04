import { Router } from "express";
import { db, enrollmentsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../lib/stripe";
import { sendEmail, buildConfirmationEmail } from "../lib/email";
import {
  CreateCheckoutBody,
  VerifyCheckoutQueryParams,
  CreateCheckoutResponse,
  VerifyCheckoutResponse,
} from "@workspace/api-zod";

const PRESALE_PRICE = 49;
const REGULAR_PRICE = 79;
const PRESALE_SPOTS = 10;
const TOTAL_CAPACITY = 20;
const COURSE_NAME = "Logopedia con IA: Tu primer curso online";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const router = Router();

async function getPresaleInfo() {
  const [result] = await db
    .select({ count: count() })
    .from(enrollmentsTable)
    .where(
      sql`${enrollmentsTable.status} = 'completed' AND ${enrollmentsTable.isPresale} = true`,
    );
  const presaleSpotsUsed = Number(result?.count ?? 0);
  const presaleSpotsLeft = Math.max(0, PRESALE_SPOTS - presaleSpotsUsed);
  const isPresale = presaleSpotsLeft > 0;
  return { presaleSpotsUsed, presaleSpotsLeft, isPresale };
}

async function getCompletedEnrollmentsCount() {
  const [totalResult] = await db
    .select({ count: count() })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.status, "completed"));
  return Number(totalResult?.count ?? 0);
}

async function finalizeEnrollmentBySessionId(sessionId: string, log: { error: (meta: unknown, msg: string) => void }) {
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const enrollmentId = session.metadata?.enrollmentId;
  if (!enrollmentId) {
    throw new Error("Sesión sin inscripción asociada");
  }

  const [enrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.id, Number(enrollmentId)));

  if (!enrollment) {
    throw new Error("Inscripción no encontrada");
  }

  if (session.payment_status === "paid" && enrollment.status !== "completed") {
    await db
      .update(enrollmentsTable)
      .set({
        status: "completed",
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .where(eq(enrollmentsTable.id, enrollment.id));

    if (!enrollment.emailSent) {
      const html = buildConfirmationEmail({
        name: enrollment.name,
        email: enrollment.email,
        pricePaid: Number(enrollment.pricePaid),
        isPresale: enrollment.isPresale,
        courseName: COURSE_NAME,
      });

      const sent = await sendEmail({
        to: enrollment.email,
        subject: `¡Inscripción confirmada! — ${COURSE_NAME}`,
        html,
      });

      if (sent) {
        await db
          .update(enrollmentsTable)
          .set({ emailSent: true })
          .where(eq(enrollmentsTable.id, enrollment.id));
      }
    }
  }

  const [updated] = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.id, Number(enrollmentId)));

  const statusMap: Record<string, "completed" | "pending" | "failed"> = {
    paid: "completed",
    unpaid: "pending",
    no_payment_required: "completed",
  };

  return {
    status: statusMap[session.payment_status] ?? "pending",
    enrollment: updated
      ? {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone ?? undefined,
          pricePaid: Number(updated.pricePaid),
          isPresale: updated.isPresale,
          status: updated.status,
          stripeSessionId: updated.stripeSessionId ?? undefined,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        }
      : undefined,
  };
}

router.post("/checkout/create", async (req, res) => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const { name, email, phone } = parsed.data;

  try {
    const completedCount = await getCompletedEnrollmentsCount();
    if (completedCount >= TOTAL_CAPACITY) {
      res.status(409).json({ error: "No quedan plazas disponibles" });
      return;
    }

    const { isPresale } = await getPresaleInfo();
    const price = isPresale ? PRESALE_PRICE : REGULAR_PRICE;

    const stripe = await getUncachableStripeClient();

    // Build success and cancel URLs
    const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
    const baseUrl =
      process.env.PUBLIC_APP_URL ??
      (domains[0]
        ? `https://${domains[0]}`
        : `http://localhost:${process.env.PORT ?? 3000}`);

    // Create pending enrollment first
    const [enrollment] = await db
      .insert(enrollmentsTable)
      .values({
        name,
        email,
        phone: phone ?? null,
        pricePaid: String(price),
        isPresale,
        status: "pending",
      })
      .returning();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: price * 100,
            product_data: {
              name: COURSE_NAME,
              description: isPresale
                ? `Precio especial de preventa (${PRESALE_SPOTS} plazas)`
                : "Precio estándar del curso",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        enrollmentId: String(enrollment.id),
        name,
        phone: phone ?? "",
        isPresale: String(isPresale),
      },
      success_url: `${baseUrl}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
    });

    // Store session ID
    await db
      .update(enrollmentsTable)
      .set({ stripeSessionId: session.id })
      .where(eq(enrollmentsTable.id, enrollment.id));

    const data = CreateCheckoutResponse.parse({
      sessionId: session.id,
      url: session.url,
      price,
      isPresale,
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Error creating checkout session");
    res.status(500).json({ error: "Error al crear la sesión de pago" });
  }
});

router.get("/checkout/verify", async (req, res) => {
  const parsed = VerifyCheckoutQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros inválidos" });
    return;
  }

  const { session_id } = parsed.data;

  try {
    const result = await finalizeEnrollmentBySessionId(session_id, req.log);
    res.json(VerifyCheckoutResponse.parse(result));
  } catch (err) {
    req.log.error({ err }, "Error verifying checkout");
    res.status(500).json({ error: "Error al verificar el pago" });
  }
});

router.post("/checkout/webhook", async (req, res) => {
  const stripeSignature = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSignature || !endpointSecret) {
    res.status(400).send("Missing webhook configuration");
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      stripeSignature,
      endpointSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.id) {
        await finalizeEnrollmentBySessionId(session.id, req.log);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Stripe webhook error");
    res.status(400).send("Webhook Error");
  }
});

export { ADMIN_SECRET };
export default router;
