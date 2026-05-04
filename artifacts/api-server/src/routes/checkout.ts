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
const COURSE_NAME = "Logopedia con IA: Tu primer curso online";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "logoped-ia-admin-2026";

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

router.post("/checkout/create", async (req, res) => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const { name, email, phone } = parsed.data;

  try {
    const { isPresale } = await getPresaleInfo();
    const price = isPresale ? PRESALE_PRICE : REGULAR_PRICE;

    const stripe = await getUncachableStripeClient();

    // Build success and cancel URLs
    const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
    const baseUrl = domains[0]
      ? `https://${domains[0]}`
      : `http://localhost:${process.env.PORT ?? 3000}`;

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
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const enrollmentId = session.metadata?.enrollmentId;
    if (!enrollmentId) {
      res.status(400).json({ error: "Sesión sin inscripción asociada" });
      return;
    }

    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, Number(enrollmentId)));

    if (!enrollment) {
      res.status(404).json({ error: "Inscripción no encontrada" });
      return;
    }

    if (session.payment_status === "paid" && enrollment.status !== "completed") {
      // Mark as completed
      await db
        .update(enrollmentsTable)
        .set({
          status: "completed",
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        })
        .where(eq(enrollmentsTable.id, enrollment.id));

      // Send confirmation email
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

      const [updated] = await db
        .select()
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.id, enrollment.id));

      res.json(
        VerifyCheckoutResponse.parse({
          status: "completed",
          enrollment: {
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
          },
        }),
      );
      return;
    }

    const statusMap: Record<string, "completed" | "pending" | "failed"> = {
      paid: "completed",
      unpaid: "pending",
      no_payment_required: "completed",
    };

    res.json(
      VerifyCheckoutResponse.parse({
        status: statusMap[session.payment_status] ?? "pending",
        enrollment: enrollment
          ? {
              id: enrollment.id,
              name: enrollment.name,
              email: enrollment.email,
              phone: enrollment.phone ?? undefined,
              pricePaid: Number(enrollment.pricePaid),
              isPresale: enrollment.isPresale,
              status: enrollment.status,
              stripeSessionId: enrollment.stripeSessionId ?? undefined,
              createdAt: enrollment.createdAt,
              updatedAt: enrollment.updatedAt,
            }
          : undefined,
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Error verifying checkout");
    res.status(500).json({ error: "Error al verificar el pago" });
  }
});

export { ADMIN_SECRET };
export default router;
