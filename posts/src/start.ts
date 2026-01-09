import express from "express";
import { postsController } from "./postsController";
import cors from "cors";
import { initDB } from "./db/conn";
import { conn } from "./db/conn";

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
    service: "microhub-users",
    timestamp: new Date().toISOString()
  });
});

// Readiness endpoint
app.get("/ready", async (req, res) => {
  try {
    await conn.query("SELECT 1"); 

    res.status(200).json({
      status: "ready",
      service: "microhub-posts",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Readiness check failed:", err);
    res.status(503).json({
      status: "not ready",
      service: "microhub-posts",
      timestamp: new Date().toISOString()
    });
  }
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