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

postsController.post(
  "/",
  async (
    req: Request<{}, {}, { title: string; text: string; author: number; topics?: string[] }>,
    res: Response<Post | string>
  ) => {
    try {
      const { title, text, author, topics } = req.body;
      
      if (!title || !text || !author) {
        res.status(400).send("Missing required fields: title, text, author");
        return;
      }

      const post = await postService.createPost(title, text, author, topics);
      res.status(201).send(post);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  }
);