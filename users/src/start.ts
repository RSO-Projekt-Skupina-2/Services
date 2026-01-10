import express from "express";
import { usersController } from "./usersController";
import cors from "cors";
import { initDB } from "./db/conn";
import { conn } from "./db/conn";
import { metricsMiddleware, metricsEndpoint } from './metrics';
import swaggerUi from "swagger-ui-express";

export const app = express();

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MicroHub Users API",
    version: "1.0.0",
  },
  paths: {
    "/users/register": {
      post: {
        summary: "Register user",
        responses: { 201: { description: "Created" }, 400: { description: "Validation error" } },
      },
    },
    "/users/login": {
      post: {
        summary: "Login",
        responses: { 200: { description: "JWT issued" }, 401: { description: "Invalid credentials" } },
      },
    },
    "/users/me": {
      get: {
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "User returned" }, 401: { description: "Unauthorized" } },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Get user by id",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: { 200: { description: "User returned" }, 404: { description: "Not found" } },
      },
    },
    "/users/verify": {
      post: {
        summary: "Verify JWT",
        responses: { 200: { description: "Valid token" }, 401: { description: "Invalid token" } },
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
app.use("/users", usersController);
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
      service: "microhub-users",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Readiness check failed:", err);
    res.status(503).json({
      status: "not ready",
      service: "microhub-users",
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
