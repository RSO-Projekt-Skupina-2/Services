import express, { Router, Request, Response } from "express";
import { PostService } from "./postsService";
import { Post } from "./postsModels";

const postService: PostService = new PostService();

export const postsController: Router = express.Router();

postsController.get(
  "/",
  async (
    req: Request<{}, {}, {}, { topic?: string }>,
    res: Response<Post[] | string>
  ) => {
    try {
      const posts = await postService.getPosts();
      res.status(200).send(posts);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);