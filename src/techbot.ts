import { Article } from "./types.js";
import { fetchRecentArticles } from "./rss-processor.js";
import {
  generateSummary,
  generateDiscussionQuestion,
  selectMostRelevantArticle,
} from "./ai-processor.js";
import { formatSlackMessage } from "./message-formatter.js";
import { ArticleHistoryManager } from "./article-history.js";

/**
 * Main TechBot class that orchestrates the entire process
 */
export const techBot = {
  /**
   * Main execution method that fetches, processes, and formats AI news articles
   */
  async run(): Promise<void> {
    // Initialize history manager
    const historyManager = new ArticleHistoryManager();
    await historyManager.loadHistory();

    try {
      console.log(
        "🤖 TechBot starting up with premium AI and development news sources...\n"
      );

      // Show history statistics
      const stats = historyManager.getStats();
      if (stats.totalSelected > 0) {
        const hoursSinceLastRun = Math.floor(
          historyManager.getTimeSinceLastRun() / (1000 * 60 * 60)
        );
        console.log(
          `📊 History: ${stats.totalSelected} articles processed, last run ${hoursSinceLastRun}h ago`
        );
      }

      // 1. Fetch AI-related articles from multiple authoritative sources
      console.log(
        "📡 Fetching latest AI and development news from top sources..."
      );
      const articles: Article[] = await fetchRecentArticles(20); // Fetch more articles for better variety

      if (articles.length === 0) {
        console.log("⚠️  No relevant articles found from configured sources.");
        console.log(
          "💡 This might be due to network issues or all feeds being temporarily unavailable."
        );
        return;
      }

      console.log(
        `📰 Successfully gathered ${articles.length} relevant articles from authoritative sources`
      );

      // Show brief overview of sources
      const sourceCount = articles.reduce((acc, article) => {
        acc[article.source] = (acc[article.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(
        "📊 Content sources:",
        Object.entries(sourceCount)
          .map(([source, count]) => `${source} (${count})`)
          .join(", ")
      );

      // 2. Select the most relevant article using AI analysis with history awareness
      console.log(
        "\n🔍 Analyzing articles to select the most valuable NEW content..."
      );
      const selectedArticle: Article = await selectMostRelevantArticle(
        articles,
        historyManager
      );

      // Add the selected article to history
      historyManager.addSelectedArticle(selectedArticle.link);
      await historyManager.saveHistory();

      console.log("─".repeat(80));
      console.log(`🎯 SELECTED ARTICLE`);
      console.log(`📰 Title: ${selectedArticle.title}`);
      console.log(`🏢 Source: ${selectedArticle.source}`);
      console.log(
        `📅 Published: ${new Date(
          selectedArticle.pubDate
        ).toLocaleDateString()}`
      );
      console.log(`🔗 Link: ${selectedArticle.link}`);
      console.log("─".repeat(80));

      // 3. Process the selected article with AI
      console.log(
        "\n🧠 Processing article with AI for insights and discussion..."
      );

      try {
        // Generate summary and question using AI
        const summary: string = await generateSummary(selectedArticle.content);
        const question: string = await generateDiscussionQuestion(
          selectedArticle.content,
          summary
        );

        // Format the message
        const message: string = formatSlackMessage({
          title: selectedArticle.title,
          summary,
          question,
          link: selectedArticle.link,
        });

        // Output to console
        console.log("\n" + "=".repeat(80));
        console.log("📱 SLACK MESSAGE READY:");
        console.log("=".repeat(80));
        console.log(message);
        console.log("=".repeat(80));

        // Additional metadata for reference
        console.log("\n📋 ARTICLE METADATA:");
        console.log(`• Source: ${selectedArticle.source}`);
        console.log(
          `• Published: ${new Date(selectedArticle.pubDate).toLocaleString()}`
        );
        console.log(
          `• Content length: ${selectedArticle.content.length} characters`
        );
        console.log(`• Direct link: ${selectedArticle.link}`);

        // Performance and history stats
        const totalArticlesConsidered = articles.length;
        const updatedStats = historyManager.getStats();
        console.log(`\n📈 PROCESSING STATS:`);
        console.log(`• Articles analyzed: ${totalArticlesConsidered}`);
        console.log(`• Sources consulted: ${Object.keys(sourceCount).length}`);
        console.log(
          `• Total articles processed historically: ${updatedStats.totalSelected}`
        );
        console.log(`• AI selection completed successfully`);
        console.log(`• Article saved to history for future uniqueness`);
      } catch (error) {
        console.error(
          `❌ Error processing selected article "${selectedArticle.title}":`,
          error instanceof Error ? error.message : "Unknown error"
        );

        // Still save the article to history even if processing failed
        // to avoid selecting it again
        console.log("💾 Saving article to history despite processing error");

        // Provide fallback information
        console.log("\n🔄 Providing fallback article information:");
        console.log(`📰 Title: ${selectedArticle.title}`);
        console.log(`🏢 Source: ${selectedArticle.source}`);
        console.log(`🔗 Link: ${selectedArticle.link}`);
        console.log(
          `📅 Published: ${new Date(
            selectedArticle.pubDate
          ).toLocaleDateString()}`
        );

        throw error;
      }

      console.log(
        "\n✅ TechBot successfully processed a fresh AI/development article!"
      );
      console.log("🚀 Ready to share new insights with your team!");
      console.log("🔄 Next run will automatically select a different article!");
    } catch (error) {
      console.error("❌ TechBot encountered an error:", error);
      console.log("\n🔧 Troubleshooting tips:");
      console.log("• Check your internet connection");
      console.log("• Verify GEMINI_API_KEY is set correctly");
      console.log("• Some RSS feeds might be temporarily unavailable");
      console.log("• Try running the bot again in a few minutes");
      console.log(
        "• If all articles have been processed, they will be recycled after 24 hours"
      );
      throw error;
    }
  },
};
