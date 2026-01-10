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
        summary: "Register a new user",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", minLength: 1 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 }
                }
              },
              example: {
                username: "john_doe",
                email: "john@example.com",
                password: "securePassword123"
              }
            }
          }
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    username: { type: "string" },
                    email: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  id: 1,
                  username: "john_doe",
                  email: "john@example.com",
                  createdAt: "2026-01-10T12:00:00.000Z"
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                examples: {
                  missing_fields: { value: { error: "Missing required fields: username, email, password" } },
                  short_password: { value: { error: "Password must be at least 6 characters long" } }
                }
              }
            }
          }
        }
      }
    },
    "/users/login": {
      post: {
        summary: "Login and get JWT token",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              },
              example: {
                email: "john@example.com",
                password: "securePassword123"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful, JWT issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        username: { type: "string" },
                        email: { type: "string" }
                      }
                    }
                  }
                },
                example: {
                  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  user: {
                    id: 1,
                    username: "john_doe",
                    email: "john@example.com"
                  }
                }
              }
            }
          },
          400: {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Missing required fields: email, password" }
              }
            }
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Invalid credentials" }
              }
            }
          }
        }
      }
    },
    "/users/me": {
      get: {
        summary: "Get current authenticated user",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    username: { type: "string" },
                    email: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  id: 1,
                  username: "john_doe",
                  email: "john@example.com",
                  createdAt: "2026-01-10T12:00:00.000Z"
                }
              }
            }
          },
          401: {
            description: "Unauthorized - invalid or missing token",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Unauthorized" }
              }
            }
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "User not found" }
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
    "/users/{id}": {
      get: {
        summary: "Get user by ID (for inter-service communication)",
        tags: ["Users"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "User ID"
          }
        ],
        responses: {
          200: {
            description: "User found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    username: { type: "string" },
                    email: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                  }
                },
                example: {
                  id: 1,
                  username: "john_doe",
                  email: "john@example.com",
                  createdAt: "2026-01-10T12:00:00.000Z"
                }
              }
            }
          },
          400: {
            description: "Invalid user ID format",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Invalid user ID" }
              }
            }
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "User not found" }
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
    "/users/verify": {
      post: {
        summary: "Verify JWT token",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string" }
                }
              },
              example: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              }
            }
          }
        },
        responses: {
          200: {
            description: "Token is valid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        username: { type: "string" },
                        email: { type: "string" }
                      }
                    }
                  }
                },
                example: {
                  valid: true,
                  user: {
                    id: 1,
                    username: "john_doe",
                    email: "john@example.com"
                  }
                }
              }
            }
          },
          400: {
            description: "Token is required",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Token is required" }
              }
            }
          },
          401: {
            description: "Invalid token",
            content: {
              "application/json": {
                schema: { type: "object", properties: { valid: { type: "boolean" }, error: { type: "string" } } },
                example: { valid: false, error: "Invalid token" }
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
