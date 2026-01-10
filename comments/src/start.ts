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
        summary: "List comments for a specific post",
        tags: ["Comments"],
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
            description: "Array of comments",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      postId: { type: "number" },
                      userId: { type: "number" },
                      text: { type: "string" },
                      authorName: { type: "string" },
                      createdAt: { type: "string", format: "date-time" }
                    }
                  }
                },
                example: [
                  {
                    id: 1,
                    postId: 1,
                    userId: 2,
                    text: "Great post!",
                    authorName: "jane_smith",
                    createdAt: "2026-01-10T12:30:00.000Z"
                  },
                  {
                    id: 2,
                    postId: 1,
                    userId: 3,
                    text: "Thanks for sharing",
                    authorName: "bob_wilson",
                    createdAt: "2026-01-10T13:00:00.000Z"
                  }
                ]
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
    "/comments": {
      post: {
        summary: "Create a new comment on a post",
        tags: ["Comments"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["postId", "text"],
                properties: {
                  postId: { type: "number" },
                  text: { type: "string", minLength: 1 }
                }
              },
              example: {
                postId: 1,
                text: "Great post!"
              }
            }
          }
        },
        responses: {
          201: {
            description: "Comment created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    postId: { type: "number" },
                    userId: { type: "number" },
                    text: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  id: 1,
                  postId: 1,
                  userId: 2,
                  text: "Great post!",
                  createdAt: "2026-01-10T12:30:00.000Z"
                }
              }
            }
          },
          400: {
            description: "Validation or moderation error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                examples: {
                  missing_fields: { value: { error: "Missing required fields: postId, text" } },
                  moderation_flagged: { value: { error: "Comment was flagged as inappropriate" } }
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
                example: { error: "Internal server error" }
              }
            }
          }
        }
      }
    },
    "/comments/{id}": {
      delete: {
        summary: "Delete own comment",
        tags: ["Comments"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "Comment ID to delete"
          }
        ],
        responses: {
          200: {
            description: "Comment deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: { message: "Comment deleted successfully" }
              }
            }
          },
          400: {
            description: "Invalid comment ID",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Invalid comment ID" }
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
            description: "Comment not found or user not authorized",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Comment not found or unauthorized" }
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
    "/comments/user/count": {
      get: {
        summary: "Count comments created by current user",
        tags: ["Comments"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Comment count returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "number" }
                  }
                },
                example: { count: 12 }
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
