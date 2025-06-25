import { Article, ProcessedArticle } from "./types";
import { fetchRecentArticles } from "./rss-processor";
import { generateSummary, generateDiscussionQuestion } from "./ai-processor";
import { formatSlackMessage } from "./message-formatter";

export const techBot = {
  async run(): Promise<void> {
    try {
      // 1. Fetch articles from RSS feeds
      console.log("📡 Fetching articles from RSS feeds...");
      const articles: Article[] = await fetchRecentArticles();

      if (articles.length === 0) {
        console.log("⚠️  No articles found. Exiting.");
        return;
      }

      console.log(`📰 Found ${articles.length} articles to process.\n`);

      // 2. Process each article with AI
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(
          `🔄 Processing article ${i + 1}/${articles.length}: ${article.title}`
        );

        try {
          // Generate summary and question using AI
          const summary: string = await generateSummary(article.content);
          const question: string = await generateDiscussionQuestion(
            article.content,
            summary
          );

          // Format the message
          const message: string = formatSlackMessage({
            title: article.title,
            summary,
            question,
            link: article.link,
          });

          // Output to console
          console.log("\n" + message + "\n");
          console.log("─".repeat(80) + "\n");
        } catch (error) {
          console.error(
            `❌ Error processing article "${article.title}":`,
            error instanceof Error ? error.message : "Unknown error"
          );
          continue;
        }
      }

      console.log("✅ TechBot finished processing all articles!");
    } catch (error) {
      console.error("❌ Error in TechBot run:", error);
      throw error;
    }
  },
};
