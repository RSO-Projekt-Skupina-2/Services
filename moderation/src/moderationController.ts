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

/**
 * POST /moderation/batch
 * Check multiple content items for inappropriate material
 */
moderationController.post(
  "/batch",
  async (
    req: Request<{}, ModerationResponse[], { contents: string[] }>,
    res: Response<ModerationResponse[] | { error: string }>
  ) => {
    try {
      const { contents } = req.body;

      if (!Array.isArray(contents)) {
        res.status(400).json({ error: "Contents must be an array" });
        return;
      }

      if (contents.length === 0) {
        res.status(400).json({ error: "Contents array cannot be empty" });
        return;
      }

      if (contents.length > 100) {
        res.status(400).json({ error: "Cannot process more than 100 items at once" });
        return;
      }

      // Validate all contents are non-empty strings
      for (let i = 0; i < contents.length; i++) {
        if (typeof contents[i] !== 'string' || contents[i].trim().length === 0) {
          res.status(400).json({ error: `Invalid content at index ${i}` });
          return;
        }
      }

      const results = await moderationService.moderateBatch(contents);
      res.status(200).json(results);
    } catch (error: any) {
      console.error('Batch moderation error:', error);
      res.status(500).json({ error: error.message || 'Batch moderation failed' });
    }
  }
);

/**
 * GET /moderation/health
 * Health check endpoint for service monitoring
 */
moderationController.get(
  "/health",
  (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      service: "moderation",
      timestamp: new Date().toISOString()
    });
  }
);
