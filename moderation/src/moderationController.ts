import express, { Router, Request, Response } from "express";
import { ModerationService } from "./moderationService";
import { ModerationRequest, ModerationResponse } from "./moderationModels";

const moderationService = new ModerationService();
export const moderationController: Router = express.Router();

/**
 * POST /moderation/check
 * Check single content for inappropriate material
 */
moderationController.post(
  "/check",
  async (
    req: Request<{}, ModerationResponse, ModerationRequest>,
    res: Response<ModerationResponse | { error: string }>
  ) => {
    try {
      const { content, contentType } = req.body;

      if (!content || typeof content !== 'string') {
        res.status(400).json({ error: "Content is required and must be a string" });
        return;
      }

      if (content.trim().length === 0) {
        res.status(400).json({ error: "Content cannot be empty" });
        return;
      }

      const result = await moderationService.moderateContent({
        content,
        contentType: contentType || 'text'
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Moderation check error:', error);
      res.status(500).json({ error: error.message || 'Moderation check failed' });
    }
  }
);

