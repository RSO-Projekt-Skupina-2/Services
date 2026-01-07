import { app, initializeApp } from "./start";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3002;

async function bootstrap() {
  try {
    // Initialize database
    await initializeApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`Users service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
