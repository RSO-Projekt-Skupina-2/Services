import express, { Router, Request, Response } from "express";
import { LikeService } from "./likesService";
import { Like } from "./likesModels";

const likeService: LikeService = new LikeService();

export const likesController: Router = express.Router();

// Get like count for a post
likesController.get(
  "/post/:postId/count",
  async (
    req: Request<{ postId: string }>,
    res: Response<{ count: number } | string>
  ) => {
    try {
      const postId = parseInt(req.params.postId);
      const count = await likeService.getLikeCount(postId);
      res.status(200).send({ count });
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Add a like
likesController.post(
  "/",
  async (
    req: Request<{}, {}, { postId: number; userId: number }>,
    res: Response<Like | string>
  ) => {
    try {
      const { postId, userId } = req.body;

      if (!postId || !userId) {
        res.status(400).send("Missing required fields: postId, userId");
        return;
      }

      const like = await likeService.addLike(postId, userId);
      res.status(201).send(like);
    } catch (e: any) {
      // Handle duplicate like (unique constraint violation)
      if (e.name === "SequelizeUniqueConstraintError") {
        res.status(409).send("User has already liked this post");
      } else {
        res.status(500).send(e.message);
      }
    }
  }
);

// Remove a like
likesController.delete(
  "/",
  async (
    req: Request<{}, {}, { postId: number; userId: number }>,
    res: Response<{ success: boolean } | string>
  ) => {
    try {
      const { postId, userId } = req.body;

      if (!postId || !userId) {
        res.status(400).send("Missing required fields: postId, userId");
        return;
      }

      const removed = await likeService.removeLike(postId, userId);
      if (removed) {
        res.status(200).send({ success: true });
      } else {
        res.status(404).send("Like not found");
      }
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);
