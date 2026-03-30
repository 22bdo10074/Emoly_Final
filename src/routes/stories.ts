import { Router, Request, Response } from "express";

const router = Router();

// GET STORIES
router.get("/", (_req: Request, res: Response) => {
return res.json({
stories: [
{
id: 1,
title: "My first story",
content: "This is a demo story 💙",
emotion: "happy",
authorName: "Anonymous",
}
],
message: "Stories working ✅ (no DB)"
});
});

// GET SINGLE STORY
router.get("/:id", (req: Request, res: Response) => {
return res.json({
id: req.params.id,
title: "Sample Story",
content: "This is a sample story",
});
});

// CREATE STORY
router.post("/", (_req: Request, res: Response) => {
return res.status(201).json({
message: "Story created (dummy) ✅"
});
});

// REACT
router.post("/:id/reactions", (_req: Request, res: Response) => {
return res.json({
success: true,
});
});

// COMMENTS
router.get("/:id/comments", (_req: Request, res: Response) => {
return res.json({
comments: [],
});
});

// ADD COMMENT
router.post("/:id/comments", (_req: Request, res: Response) => {
return res.json({
message: "Comment added (dummy) ✅",
});
});

export default router;
