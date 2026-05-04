import { Router, type IRouter } from "express";
import healthRouter from "./health";
import courseRouter from "./course";
import checkoutRouter from "./checkout";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(courseRouter);
router.use(checkoutRouter);
router.use(adminRouter);

export default router;
