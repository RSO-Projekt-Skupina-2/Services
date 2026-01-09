import express from "express";
import { usersController } from "./usersController";
import cors from "cors";
import { initDB } from "./db/conn";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/users", usersController);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "microhub-users",
    timestamp: new Date().toISOString()
  });
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
