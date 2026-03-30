import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { SignupBody, LoginBody } from "@workspace/api-zod";
import { requireAuth, signToken, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/signup", async (req, res) => {
  const parse = SignupBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "ValidationError", message: parse.error.message });
    return;
  }

  const { username, email, password, anonymous } = parse.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "ConflictError", message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    anonymous: anonymous ?? false,
  }).returning();

  const token = signToken(user.id, user.email);
  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      anonymous: user.anonymous,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/login", async (req, res) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "ValidationError", message: parse.error.message });
    return;
  }

  const { email, password } = parse.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "AuthError", message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "AuthError", message: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id, user.email);
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      anonymous: user.anonymous,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "AuthError", message: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    anonymous: user.anonymous,
    createdAt: user.createdAt,
  });
});

export default router;
