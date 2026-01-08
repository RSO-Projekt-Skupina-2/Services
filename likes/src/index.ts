import { app, initializeApp } from "./start";
import { LikeService } from "./likesService";

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3001;

async function testLikes() {
  const likeService = new LikeService();

  console.log("\n=== Testing Likes Service ===");

  // Add a test like
  console.log("\n--- Adding like ---");
  const like = await likeService.addLike(1, 1);
  console.log("Added like:", like);

  // Get like count
  console.log("\n--- Getting like count ---");
  const count = await likeService.getLikeCount(1);
  console.log("Like count for post 1:", count);

  console.log("\n=== Tests complete ===\n");
}

async function bootstrap() {
  try {
    // Initialize database
    await initializeApp();

    // Test likes (create and get)
    await testLikes();

    // Start server
    app.listen(PORT, () => {
      console.log(`Likes service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
