import express from "express";
import { postsController } from "./postsController";
import cors from "cors";


export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/posts", postsController);