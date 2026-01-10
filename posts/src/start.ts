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
        summary: "List all posts with optional topic filter",
        tags: ["Posts"],
        parameters: [
          {
            in: "query",
            name: "topic",
            schema: { type: "string" },
            description: "Optional topic to filter posts"
          }
        ],
        responses: {
          200: {
            description: "Array of posts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      title: { type: "string" },
                      text: { type: "string" },
                      author: { type: "number" },
                      authorName: { type: "string" },
                      topics: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                example: [
                  {
                    id: 1,
                    title: "My First Post",
                    text: "This is the content of my first post",
                    author: 1,
                    authorName: "john_doe",
                    topics: ["technology", "javascript"]
                  },
                  {
                    id: 2,
                    title: "Another Post",
                    text: "More content here",
                    author: 2,
                    authorName: "jane_smith",
                    topics: ["design"]
                  }
                ]
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
      post: {
        summary: "Create a new post",
        tags: ["Posts"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "text"],
                properties: {
                  title: { type: "string", minLength: 1 },
                  text: { type: "string", minLength: 1 },
                  topics: { type: "array", items: { type: "string" } }
                }
              },
              example: {
                title: "My First Post",
                text: "This is the content of my first post",
                topics: ["technology", "javascript"]
              }
            }
          }
        },
        responses: {
          201: {
            description: "Post created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    title: { type: "string" },
                    text: { type: "string" },
                    author: { type: "number" },
                    topics: { type: "array", items: { type: "string" } }
                  }
                },
                example: {
                  id: 1,
                  title: "My First Post",
                  text: "This is the content of my first post",
                  author: 1,
                  topics: ["technology", "javascript"]
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
                  missing_fields: { value: { error: "Missing required fields: title, text" } },
                  moderation_flagged: { value: { error: "Content was flagged as inappropriate" } }
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
    "/posts/count/mine": {
      get: {
        summary: "Count posts created by current user",
        tags: ["Posts"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Post count returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "number" }
                  }
                },
                example: { count: 5 }
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
    "/posts/{id}": {
      delete: {
        summary: "Delete own post",
        tags: ["Posts"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "Post ID to delete"
          }
        ],
        responses: {
          200: {
            description: "Post deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: { message: "Post deleted successfully" }
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
          404: {
            description: "Post not found or user not authorized",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Post not found or unauthorized" }
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
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
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