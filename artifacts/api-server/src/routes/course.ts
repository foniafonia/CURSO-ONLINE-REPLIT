import { Router } from "express";
import { db, enrollmentsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { GetCourseInfoResponse } from "@workspace/api-zod";

const PRESALE_PRICE = 49;
const REGULAR_PRICE = 79;
const PRESALE_SPOTS = 10;

const router = Router();

router.get("/course/info", async (req, res) => {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(enrollmentsTable)
      .where(
        sql`${enrollmentsTable.status} = 'completed' AND ${enrollmentsTable.isPresale} = true`,
      );

    const [totalResult] = await db
      .select({ count: count() })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.status, "completed"));

    const presaleSpotsUsed = Number(result?.count ?? 0);
    const presaleSpotsLeft = Math.max(0, PRESALE_SPOTS - presaleSpotsUsed);
    const isPresale = presaleSpotsLeft > 0;
    const totalEnrolled = Number(totalResult?.count ?? 0);

    const data = GetCourseInfoResponse.parse({
      title: "Logopedia con IA: Tu primer curso online",
      description:
        "Aprende a integrar la inteligencia artificial en tu práctica logopédica. Un curso práctico, actualizado y pensado para profesionales que quieren liderar el cambio.",
      presalePrice: PRESALE_PRICE,
      regularPrice: REGULAR_PRICE,
      presaleSpots: PRESALE_SPOTS,
      presaleSpotsUsed,
      presaleSpotsLeft,
      isPresale,
      currentPrice: isPresale ? PRESALE_PRICE : REGULAR_PRICE,
      totalEnrolled,
    });

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Error getting course info");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
