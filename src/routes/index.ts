import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import storiesRouter from "./stories.js";
import chatRouter from "./chat.js";
import moodsRouter from "./moods.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/stories", storiesRouter);
router.use("/chat", chatRouter);
router.use("/moods", moodsRouter);

export default router;
