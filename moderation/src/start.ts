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
        summary: "Check content for inappropriate material",
        tags: ["Moderation"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", minLength: 1 },
                  contentType: {
                    type: "string",
                    enum: ["post", "comment", "text"],
                    description: "Type of content being moderated"
                  }
                }
              },
              examples: {
                post: { value: { content: "This is a post content", contentType: "post" } },
                comment: { value: { content: "This is a comment", contentType: "comment" } }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Moderation check result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    approved: { type: "boolean" },
                    flagged: { type: "boolean" },
                    flaggedCategories: { type: "array", items: { type: "string" } },
                    details: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        model: { type: "string" },
                        flagged: { type: "boolean" },
                        categories: {
                          type: "object",
                          properties: {
                            sexual: { type: "boolean" },
                            hate: { type: "boolean" },
                            harassment: { type: "boolean" },
                            selfHarm: { type: "boolean" },
                            sexualMinors: { type: "boolean" },
                            hateThreatening: { type: "boolean" },
                            violenceGraphic: { type: "boolean" },
                            selfHarmIntent: { type: "boolean" },
                            selfHarmInstructions: { type: "boolean" },
                            harassmentThreatening: { type: "boolean" },
                            violence: { type: "boolean" }
                          }
                        },
                        categoryScores: {
                          type: "object",
                          properties: {
                            sexual: { type: "number" },
                            hate: { type: "number" },
                            harassment: { type: "number" },
                            selfHarm: { type: "number" },
                            sexualMinors: { type: "number" },
                            hateThreatening: { type: "number" },
                            violenceGraphic: { type: "number" },
                            selfHarmIntent: { type: "number" },
                            selfHarmInstructions: { type: "number" },
                            harassmentThreatening: { type: "number" },
                            violence: { type: "number" }
                          }
                        }
                      }
                    }
                  }
                },
                examples: {
                  approved: {
                    value: {
                      approved: true,
                      flagged: false,
                      flaggedCategories: [],
                      details: {
                        id: "modr-123",
                        model: "text-moderation-latest",
                        flagged: false,
                        categories: {
                          sexual: false,
                          hate: false,
                          harassment: false,
                          selfHarm: false,
                          sexualMinors: false,
                          hateThreatening: false,
                          violenceGraphic: false,
                          selfHarmIntent: false,
                          selfHarmInstructions: false,
                          harassmentThreatening: false,
                          violence: false
                        },
                        categoryScores: {
                          sexual: 0.001,
                          hate: 0.0,
                          harassment: 0.0,
                          selfHarm: 0.0,
                          sexualMinors: 0.0,
                          hateThreatening: 0.0,
                          violenceGraphic: 0.0,
                          selfHarmIntent: 0.0,
                          selfHarmInstructions: 0.0,
                          harassmentThreatening: 0.0,
                          violence: 0.0
                        }
                      }
                    }
                  },
                  flagged: {
                    value: {
                      approved: false,
                      flagged: true,
                      flaggedCategories: ["hate", "harassment"],
                      details: {
                        id: "modr-456",
                        model: "text-moderation-latest",
                        flagged: true,
                        categories: {
                          sexual: false,
                          hate: true,
                          harassment: true,
                          selfHarm: false,
                          sexualMinors: false,
                          hateThreatening: false,
                          violenceGraphic: false,
                          selfHarmIntent: false,
                          selfHarmInstructions: false,
                          harassmentThreatening: false,
                          violence: false
                        },
                        categoryScores: {
                          sexual: 0.0,
                          hate: 0.95,
                          harassment: 0.87,
                          selfHarm: 0.0,
                          sexualMinors: 0.0,
                          hateThreatening: 0.1,
                          violenceGraphic: 0.0,
                          selfHarmIntent: 0.0,
                          selfHarmInstructions: 0.0,
                          harassmentThreatening: 0.0,
                          violence: 0.0
                        }
                      }
                    }
                  }
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
                  missing_content: { value: { error: "Content is required and must be a string" } },
                  empty_content: { value: { error: "Content cannot be empty" } }
                }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string" } } },
                example: { error: "Moderation check failed" }
              }
            }
          }
        }
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
