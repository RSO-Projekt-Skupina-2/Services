import express, { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { CommentService } from "./commentsService";
import { Comment } from "./commentsModels";

const commentService: CommentService = new CommentService();
export const commentsController: Router = express.Router();

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

// Get comments for a post
commentsController.get(
  "/post/:postId",
  async (
    req: Request<{ postId: string }>,
    res: Response<Comment[] | string>
  ) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        res.status(400).send("Invalid post ID");
        return;
      }

      const comments = await commentService.getCommentsByPost(postId);
      res.status(200).send(comments);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Create a comment
commentsController.post(
  "/",
  authenticate,
  async (
    req: AuthedRequest<{}, {}, { postId: number; text: string }>,
    res: Response<Comment | string>
  ) => {
    try {
      const { postId, text } = req.body;

      if (!postId || !text) {
        res.status(400).send("Missing required fields: postId, text");
        return;
      }

      const comment = await commentService.createComment(postId, req.user!.id, text);
      res.status(201).send(comment);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Delete a comment
commentsController.delete(
  "/:id",
  authenticate,
  async (
    req: AuthedRequest<{ id: string }>,
    res: Response<{ message: string } | string>
  ) => {
    try {
      const commentId = parseInt(req.params.id);

      if (isNaN(commentId)) {
        res.status(400).send("Invalid comment ID");
        return;
      }

      const deleted = await commentService.deleteComment(commentId, req.user!.id);

      if (!deleted) {
        res.status(404).send("Comment not found or unauthorized");
        return;
      }

      res.status(200).send({ message: "Comment deleted successfully" });
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

// Get how many comments current user has made
commentsController.get(
  "/user/count",
  authenticate,
  async (
    req: AuthedRequest,
    res: Response<{ count: number } | string>
  ) => {
    try {
      const count = await commentService.countByUser(req.user!.id);
      res.status(200).send({ count });
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);
