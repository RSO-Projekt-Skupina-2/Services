import express from "express";
import { moderationController } from "./moderationController";
import cors from "cors";
import { metricsMiddleware, metricsEndpoint } from './metrics';

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/moderation", moderationController);

// Metrics endpoint
app.use(metricsMiddleware);
metricsEndpoint(app);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "microhub-moderation",
    timestamp: new Date().toISOString()
  });
});

// Readiness endpoint
app.get("/ready", async (req, res) => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    res.status(200).json({
      status: "ready",
      service: "microhub-moderation",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Readiness check failed:", err);
    res.status(503).json({
      status: "not ready",
      service: "microhub-moderation",
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

export async function initializeApp() {
  console.log("Moderation service initialized");
}
