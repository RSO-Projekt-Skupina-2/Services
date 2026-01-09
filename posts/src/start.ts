import express from "express";
import { postsController } from "./postsController";
import cors from "cors";
import { initDB } from "./db/conn";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/posts", postsController);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "microhub-posts",
    timestamp: new Date().toISOString()
  });
});

// Initialize database on startup
export async function initializeApp() {
  try {
    await initDB();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}