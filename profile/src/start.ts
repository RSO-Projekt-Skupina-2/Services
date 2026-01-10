import express from "express";
import cors from "cors";
import { profileController } from "./profileController";
import { metricsMiddleware, metricsEndpoint } from "./metrics";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/profile", profileController);

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
