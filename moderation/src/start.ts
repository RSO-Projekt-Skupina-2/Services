import express from "express";
import { moderationController } from "./moderationController";
import cors from "cors";
import { metricsMiddleware, metricsEndpoint } from './metrics';
import swaggerUi from "swagger-ui-express";

export const app = express();

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MicroHub Moderation API",
    version: "1.0.0",
  },
  paths: {
    "/moderation/check": {
      post: {
        summary: "Moderate content",
        requestBody: { required: true },
        responses: {
          200: { description: "Moderation result" },
          400: { description: "Validation error" },
        },
      },
    },
  },
};

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/moderation", moderationController);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
