import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

export let conn: Sequelize;
dotenv.config();

if (process.env.NODE_ENV === "test") {
  conn = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
  });
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }
  conn = new Sequelize(process.env.DATABASE_URL, {
    schema: "likes",
    logging: false,
  });
}

export async function initDB() {
  try {
    // Create schema if it doesn't exist
    await conn.query(`CREATE SCHEMA IF NOT EXISTS likes;`);

    // Sync models
    await conn.sync({ alter: true, force: false });

    console.log("Database initialized for likes service");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
