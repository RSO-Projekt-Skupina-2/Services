import express from "express";
import cors from "cors";
import { profileController } from "./profileController";
import { metricsMiddleware, metricsEndpoint } from "./metrics";
import swaggerUi from "swagger-ui-express";

export const app = express();

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MicroHub Profile API",
    version: "1.0.0",
  },
  paths: {
    "/profile/me": {
      get: {
        summary: "Get aggregated profile summary for current user",
        tags: ["Profile"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile summary with aggregated stats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    username: { type: "string" },
                    email: { type: "string" },
                    postsCount: { type: "number" },
                    likesGivenCount: { type: "number" },
                    commentsCount: { type: "number" }
                  }
                },
                example: {
                  id: 1,
                  username: "john_doe",
                  email: "john@example.com",
                  postsCount: 5,
                  likesGivenCount: 8,
                  commentsCount: 12
                }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Unauthorized" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Failed to load profile" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    }
  }
};

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/profile", profileController);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(metricsMiddleware);
metricsEndpoint(app);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "microhub-profile",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (_req, res) => {
  try {
    res.status(200).json({
      status: "ready",
      service: "microhub-profile",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "not ready",
      service: "microhub-profile",
      timestamp: new Date().toISOString(),
    });
  }
});

export async function initializeApp() {
  // no DB; nothing to init
}
