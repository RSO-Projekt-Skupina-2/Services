import express, { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { PostService } from "./postsService";
import { Post } from "./postsModels";

const postService: PostService = new PostService();

export const postsController: Router = express.Router();

type AuthedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = Request<P, ResBody, ReqBody, ReqQuery> & { user?: AuthTokenPayload };

interface AuthTokenPayload {
  id: number;
  username: string;
  email: string;
}

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;

async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
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

postsController.get(
  "/",
  async (
    req: Request<{}, {}, {}, { topic?: string }>,
    res: Response<Post[] | string>
  ) => {
    try {
      const { topic } = req.query;
      const posts = await postService.getPosts();
      
      if (topic) {
        const filteredPosts = posts.filter(post => 
          post.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
        );
        res.status(200).send(filteredPosts);
      } else {
        res.status(200).send(posts);
      }
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);

postsController.post(
  "/",
  authenticate,
  async (
    req: AuthedRequest<{}, {}, { title: string; text: string; topics?: string[] }>,
    res: Response<Post | string>
  ) => {
    try {
      const { title, text, topics } = req.body;

      if (!title || !text) {
        res.status(400).send("Missing required fields: title, text");
        return;
      }

      if (!req.user?.id) {
        res.status(401).send("Unauthorized");
        return;
      }

      const post = await postService.createPost(title, text, req.user.id, topics);
      res.status(201).send(post);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);