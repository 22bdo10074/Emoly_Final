import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { moodEntriesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { LogMoodBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parse = LogMoodBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "ValidationError", message: parse.error.message });
    return;
  }

  const { mood, note } = parse.data;
  const userId = req.userId!;

  const [entry] = await db.insert(moodEntriesTable).values({
    userId,
    mood,
    note: note || null,
  }).returning();

  res.status(201).json(entry);
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const entries = await db.select()
    .from(moodEntriesTable)
    .where(eq(moodEntriesTable.userId, userId))
    .orderBy(desc(moodEntriesTable.createdAt))
    .limit(30);

  res.json({ entries });
});

export default router;
