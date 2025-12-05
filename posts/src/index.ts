import { app, initializeApp } from "./start";
import { PostService } from "./postsService";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;


async function bootstrap() {
  try {
    // Initialize database
    await initializeApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`Posts service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();