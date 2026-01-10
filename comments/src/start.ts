import express from "express";
import { commentsController } from "./commentsController";
import cors from "cors";
import { initDB } from "./db/conn";
import { conn } from "./db/conn";
import { metricsMiddleware, metricsEndpoint } from './metrics';
import swaggerUi from "swagger-ui-express";

export const app = express();

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MicroHub Comments API",
    version: "1.0.0",
  },
  paths: {
    "/comments/post/{postId}": {
      get: {
        summary: "List comments for a post",
        parameters: [
          { in: "path", name: "postId", required: true, schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Array of comments" }, 400: { description: "Invalid id" } },
      },
    },
    "/comments": {
      post: {
        summary: "Create comment",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "Comment created" },
          400: { description: "Validation or moderation error" },
        },
      },
    },
    "/comments/{id}": {
      delete: {
        summary: "Delete own comment",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
      },
    },
    "/comments/user/count": {
      get: {
        summary: "Count comments of current user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Count returned" } },
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
app.use("/comments", commentsController);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
