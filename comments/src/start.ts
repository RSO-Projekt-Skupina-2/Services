import express from "express";
import { commentsController } from "./commentsController";
import cors from "cors";
import { initDB } from "./db/conn";
import { conn } from "./db/conn";
import { metricsMiddleware, metricsEndpoint } from './metrics';

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/comments", commentsController);

app.use(metricsMiddleware);
metricsEndpoint(app);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "microhub-comments",
    timestamp: new Date().toISOString()
  });
});

app.get("/ready", async (req, res) => {
  try {
    await conn.query("SELECT 1");

    res.status(200).json({
      status: "ready",
      service: "microhub-comments",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Readiness check failed:", err);
    res.status(503).json({
      status: "not ready",
      service: "microhub-comments",
      timestamp: new Date().toISOString()
    });
  }
});

export async function initializeApp() {
  try {
    await initDB();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
