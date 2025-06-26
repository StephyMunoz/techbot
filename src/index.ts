import dotenv from "dotenv";
import { techBot } from "./techbot.js";
import { ArticleHistoryManager } from "./article-history.js";

// Load environment variables
dotenv.config();

async function main() {
  // Check for command line arguments
  const args = process.argv.slice(2);

  if (args.includes("--clear-history")) {
    console.log("🗑️  Clearing TechBot article history...");
    const historyManager = new ArticleHistoryManager();
    await historyManager.clearHistory();
    console.log(
      "✅ Article history cleared! Next run will have access to all articles again."
    );
    return;
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log("🤖 TechBot - AI-Powered Tech News Curator");
    console.log("");
    console.log("Usage:");
    console.log("  npm run start              Run TechBot normally");
    console.log("  npm run start -- --clear-history    Clear article history");
    console.log("  npm run start -- --help             Show this help");
    console.log("");
    console.log("TechBot automatically tracks previously selected articles");
    console.log("to ensure you get different content on each run.");
    return;
  }

  try {
    console.log("🤖 TechBot starting up...\n");

    await techBot.run();
  } catch (error) {
    console.error("❌ TechBot failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
