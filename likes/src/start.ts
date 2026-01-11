import express from "express";
import { likesController } from "./likesController";
import cors from "cors";
import { initDB } from "./db/conn";
import { conn } from "./db/conn";
import { metricsMiddleware, metricsEndpoint } from './metrics';
import swaggerUi from "swagger-ui-express";

export const app = express();

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MicroHub Likes API",
    version: "1.0.0",
  },
  paths: {
    "/likes/post/{postId}/status": {
      get: {
        summary: "Get like count and status for a post",
        parameters: [
          { in: "path", name: "postId", required: true, schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Status returned" }, 400: { description: "Invalid id" } },
      },
    },
    "/likes/user/count": {
      get: {
        summary: "Count likes given by current user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Count returned" } },
      },
    },
    "/likes": {
      post: {
        summary: "Add like",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Like created" }, 409: { description: "Already liked" } },
      },
      delete: {
        summary: "Remove like",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Removed" }, 404: { description: "Not found" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
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
app.use("/likes", likesController);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Metrics endpoint
app.use(metricsMiddleware);
metricsEndpoint(app);

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
      service: "microhub-likes",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Readiness check failed:", err);
    res.status(503).json({
      status: "not ready",
      service: "microhub-likes",
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
