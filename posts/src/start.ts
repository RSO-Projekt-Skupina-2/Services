import express from "express";
import { postsController } from "./postsController";
import cors from "cors";
import { initDB } from "./db/conn";
import { conn } from "./db/conn";
import { metricsMiddleware, metricsEndpoint } from './metrics';
import swaggerUi from "swagger-ui-express";

export const app = express();

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MicroHub Posts API",
    version: "1.0.0",
  },
  paths: {
    "/posts": {
      get: {
        summary: "List posts",
        parameters: [
          {
            in: "query",
            name: "topic",
            schema: { type: "string" },
            description: "Optional topic filter",
          },
        ],
        responses: {
          200: { description: "Array of posts" },
          500: { description: "Server error" }
        },
      },
      post: {
        summary: "Create post",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "Post created" },
          400: { description: "Validation or moderation error" },
          401: { description: "Unauthorized" },
          500: { description: "Server error" }
        },
      },
    },
    "/posts/count/mine": {
      get: {
        summary: "Count posts of current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Count returned" },
          401: { description: "Unauthorized" },
          500: { description: "Server error" }
        },
      },
    },
    "/posts/{id}": {
      delete: {
        summary: "Delete own post",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Deleted" },
          400: { description: "Invalid post ID" },
          401: { description: "Unauthorized" },
          404: { description: "Not found or unauthorized" },
          500: { description: "Server error" }
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
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
app.use("/posts", postsController);
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