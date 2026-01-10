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
        summary: "Get like count and current user's like status for a post",
        tags: ["Likes"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "postId",
            required: true,
            schema: { type: "integer" },
            description: "Post ID"
          }
        ],
        responses: {
          200: {
            description: "Like status and count",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "number" },
                    liked: { type: "boolean" }
                  }
                },
                examples: {
                  liked: { value: { count: 5, liked: true } },
                  not_liked: { value: { count: 3, liked: false } }
                }
              }
            }
          },
          400: {
            description: "Invalid post ID",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Invalid post ID" }
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
                example: { error: "Internal server error" }
              }
            }
          }
        }
      }
    },
    "/likes/user/count": {
      get: {
        summary: "Count likes given by current user",
        tags: ["Likes"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Like count",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "number" }
                  }
                },
                example: { count: 8 }
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
                example: { error: "Internal server error" }
              }
            }
          }
        }
      }
    },
    "/likes": {
      post: {
        summary: "Like a post",
        tags: ["Likes"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["postId"],
                properties: {
                  postId: { type: "number" }
                }
              },
              example: {
                postId: 1
              }
            }
          }
        },
        responses: {
          201: {
            description: "Like created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    postId: { type: "number" },
                    userId: { type: "number" },
                    createdAt: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  id: 1,
                  postId: 1,
                  userId: 2,
                  createdAt: "2026-01-10T12:30:00.000Z"
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Missing required fields: postId" }
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
          409: {
            description: "Conflict - User has already liked this post",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "User has already liked this post" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Internal server error" }
              }
            }
          }
        }
      },
      delete: {
        summary: "Remove a like from a post",
        tags: ["Likes"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["postId"],
                properties: {
                  postId: { type: "number" }
                }
              },
              example: {
                postId: 1
              }
            }
          }
        },
        responses: {
          200: {
            description: "Like removed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" }
                  }
                },
                example: { success: true }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Missing required fields: postId" }
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
          404: {
            description: "Like not found",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Like not found" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Internal server error" }
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
