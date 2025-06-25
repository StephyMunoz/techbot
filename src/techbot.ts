import { Article } from "./types.js";
import { fetchRecentArticles } from "./rss-processor.js";
import {
	generateSummary,
	generateDiscussionQuestion,
	selectMostRelevantArticle,
} from "./ai-processor.js";
import { formatSlackMessage } from "./message-formatter.js";

export const techBot = {
	async run(): Promise<void> {
		try {
			// 1. Fetch articles from RSS feeds
			console.log("📡 Fetching articles from RSS feeds...");
			const articles: Article[] = await fetchRecentArticles(10); // Fetch more articles for better selection

			if (articles.length === 0) {
				console.log("⚠️  No articles found. Exiting.");
				return;
			}

			console.log(
				`📰 Found ${articles.length} articles. Selecting the most relevant one...`
			);

			// 2. Select the most relevant article using AI
			const selectedArticle: Article = await selectMostRelevantArticle(articles);
			console.log(
				`🎯 Selected article: ${selectedArticle.title} (${selectedArticle.source})`
			);

			// 3. Process the selected article with AI
			console.log("🔄 Processing selected article with AI...");

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
				console.log("\n" + message + "\n");
				console.log("─".repeat(80) + "\n");
			} catch (error) {
				console.error(
					`❌ Error processing selected article "${selectedArticle.title}":`,
					error instanceof Error ? error.message : "Unknown error"
				);
				throw error;
			}

			console.log("✅ TechBot finished processing the most relevant article!");
		} catch (error) {
			console.error("❌ Error in TechBot run:", error);
			throw error;
		}
	},
};
