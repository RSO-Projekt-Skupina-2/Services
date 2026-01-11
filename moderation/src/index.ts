import 'dotenv/config';
import { app, initializeApp } from "./start";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3005;

async function bootstrap() {
  try {
    await initializeApp();

    app.listen(PORT, () => {
      console.log(`Moderation service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
