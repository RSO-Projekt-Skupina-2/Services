import { app, initializeApp } from "./start";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3003;

async function bootstrap() {
  try {
    await initializeApp();

    app.listen(PORT, () => {
      console.log(`Comments service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
