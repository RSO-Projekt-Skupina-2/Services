import express, { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { LikeService } from "./likesService";
import { Like } from "./likesModels";

const likeService: LikeService = new LikeService();
export const likesController: Router = express.Router();

interface AuthTokenPayload {
  id: number;
  username: string;
  email: string;
}

type AuthedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = 
  Request<P, ResBody, ReqBody, ReqQuery> & { user?: AuthTokenPayload };

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;

async function authenticate(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.substring(7);
    const verifyRes = await axios.post(`${USERS_SERVICE_URL}/users/verify`, { token });

    if (!verifyRes.data?.valid || !verifyRes.data?.user) {
      res.status(401).json({ error: "Token verification failed" });
      return;
    }

    req.user = verifyRes.data.user as AuthTokenPayload;
    next();
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Authentication failed";
    res.status(401).json({ error: message });
  }
}

// Get how many likes current user has given
likesController.get(
  "/user/count",
  authenticate,
  async (
    req: AuthedRequest,
    res: Response<{ count: number } | string>
  ) => {
    try {
      const count = await likeService.countByUser(req.user!.id);
      res.status(200).send({ count });
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Get like status for current user
likesController.get(
  "/post/:postId/status",
  authenticate,
  async (
    req: AuthedRequest<{ postId: string }>,
    res: Response<{ count: number; liked: boolean } | string>
  ) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        res.status(400).send("Invalid post ID");
        return;
      }

      const [count, liked] = await Promise.all([
        likeService.getLikeCount(postId),
        likeService.hasUserLiked(postId, req.user!.id),
      ]);

      res.status(200).send({ count, liked });
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Add a like
likesController.post(
  "/",
  authenticate,
  async (
    req: AuthedRequest<{}, {}, { postId: number }>,
    res: Response<Like | string>
  ) => {
    try {
      const { postId } = req.body;

      if (!postId) {
        res.status(400).send("Missing required fields: postId");
        return;
      }

      const like = await likeService.addLike(postId, req.user!.id);
      if (!like) {
        res.status(409).send("User has already liked this post");
        return;
      }
      res.status(201).send(like);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Remove a like
likesController.delete(
  "/",
  authenticate,
  async (
    req: AuthedRequest<{}, {}, { postId: number }>,
    res: Response<{ success: boolean } | string>
  ) => {
    try {
      const { postId } = req.body;

      if (!postId) {
        res.status(400).send("Missing required fields: postId");
        return;
      }

      const removed = await likeService.removeLike(postId, req.user!.id);
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
