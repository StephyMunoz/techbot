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
			// 1. Fetch AI-related articles from news sources
			console.log("🤖 Fetching latest AI-related news from technology sources...");
			const articles: Article[] = await fetchRecentArticles(10); // Fetch top 10 AI articles

			if (articles.length === 0) {
				console.log("⚠️  No AI-related articles found. Exiting.");
				return;
			}

			console.log(
				`📰 Found ${articles.length} AI-related articles. Selecting the most relevant one...`
			);

			// 2. Select the most relevant AI article using AI
			const selectedArticle: Article = await selectMostRelevantArticle(articles);
			console.log(
				`🎯 Selected AI article: ${selectedArticle.title} (${selectedArticle.source})`
			);
			console.log(
				`📅 Published: ${new Date(selectedArticle.pubDate).toLocaleDateString()}`
			);

			// 3. Process the selected article with AI
			console.log("🔄 Processing selected AI article with AI...");

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
					`❌ Error processing selected AI article "${selectedArticle.title}":`,
					error instanceof Error ? error.message : "Unknown error"
				);
				throw error;
			}

			console.log("✅ TechBot finished processing the most relevant AI article!");
		} catch (error) {
			console.error("❌ Error in TechBot run:", error);
			throw error;
		}
	},
};
