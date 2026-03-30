import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable, usersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { CreateChatSessionBody, SendMessageBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const EMHU_RESPONSES = [
  "I hear you. You're not alone in this. Can you tell me more about what you're feeling?",
  "That sounds really difficult. It takes real strength to talk about this. What's been the hardest part?",
  "Thank you for sharing that with me. Your feelings are completely valid. What do you need right now?",
  "I'm here with you. Sometimes just putting words to our feelings helps. How long have you been feeling this way?",
  "You're being so brave by opening up. Many people feel exactly what you're feeling. What would feel supportive right now?",
  "It's okay to not be okay. Your journey is your own. What small thing could you do today to care for yourself?",
  "I'm listening. You matter, and your feelings matter. Is there someone in your life you trust to talk to?",
  "Healing isn't linear, and that's okay. You're taking the right step by reaching out. What does support look like for you?",
];

const EMYOU_PEER_RESPONSES = [
  "Hey, I see you. I've been through something similar and just want you to know — it gets better.",
  "That really resonates with me. You're not alone in feeling this way.",
  "Thanks for being open here. It takes courage. I'm listening if you want to share more.",
  "I totally get that feeling. What's been going on for you lately?",
  "Honestly, same. It helps just to talk, doesn't it? I'm here.",
  "I felt exactly like that not too long ago. What's been the toughest part of your day?",
  "You're in a safe space here. No judgment. What's on your mind?",
  "That sounds heavy. I'm glad you reached out. Have you been able to talk to anyone about this?",
  "I hear you. Sometimes putting it into words is the first step. Keep going, I'm listening.",
  "We're all just trying to figure it out together. What would make today even a little easier for you?",
];

const EMYOU_WELCOME = "Welcome to E'm You — a safe, anonymous space to connect. Someone is here to listen. What's on your mind today?";
const EMHU_WELCOME = "Hi, I'm Em — your story companion. This is a safe, judgment-free space. I'm here to listen and support you. What would you like to talk about today?";

router.get("/sessions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const sessions = await db.select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId))
    .orderBy(desc(chatSessionsTable.createdAt));

  res.json({ sessions });
});

router.post("/sessions", requireAuth, async (req: AuthRequest, res) => {
  const parse = CreateChatSessionBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "ValidationError", message: parse.error.message });
    return;
  }

  const { mode, topic } = parse.data;
  const userId = req.userId!;

  const [session] = await db.insert(chatSessionsTable).values({
    userId,
    mode,
    topic: topic || null,
  }).returning();

  const welcomeMsg = mode === "emhu" ? EMHU_WELCOME : EMYOU_WELCOME;
  await db.insert(chatMessagesTable).values({
    sessionId: session.id,
    senderType: "companion",
    content: welcomeMsg,
  });

  res.status(201).json(session);
});

router.get("/sessions/:sessionId/messages", requireAuth, async (req: AuthRequest, res) => {
  const sessionId = Number(req.params.sessionId);
  const userId = req.userId!;

  const [session] = await db.select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== userId) {
    res.status(404).json({ error: "NotFound", message: "Session not found" });
    return;
  }

  const messages = await db.select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  res.json({ messages });
});

router.post("/sessions/:sessionId/messages", requireAuth, async (req: AuthRequest, res) => {
  const sessionId = Number(req.params.sessionId);
  const userId = req.userId!;

  const [session] = await db.select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== userId) {
    res.status(404).json({ error: "NotFound", message: "Session not found" });
    return;
  }

  const parse = SendMessageBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "ValidationError", message: parse.error.message });
    return;
  }

  const { content } = parse.data;

  const [message] = await db.insert(chatMessagesTable).values({
    sessionId,
    senderType: "user",
    content,
  }).returning();

  const responsePool = session.mode === "emhu" ? EMHU_RESPONSES : EMYOU_PEER_RESPONSES;
  const replyDelay = session.mode === "emhu" ? 1200 : 800 + Math.floor(Math.random() * 1400);
  setTimeout(async () => {
    const reply = responsePool[Math.floor(Math.random() * responsePool.length)];
    await db.insert(chatMessagesTable).values({
      sessionId,
      senderType: "companion",
      content: reply,
    });
  }, replyDelay);

  res.status(201).json(message);
});

export default router;
