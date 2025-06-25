import Parser from "rss-parser";
import { Article, RSSFeed, RSSItem } from "./types.js";
import { getConfig } from "./config.js";

const parser = new Parser();

const removeDuplicates = (articles: Article[]): Article[] => {
	const seen = new Set<string>();
	return articles.filter((article) => {
		const key = article.title.toLowerCase().trim();
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
};

const processFeedItems = (items: RSSItem[], source: string): Article[] => {
	return items
		.filter((item) => item.title && item.link && item.pubDate) // Filter out items with missing required data
		.map((item) => ({
			title: item.title!,
			link: item.link!,
			content: item.content || item.contentSnippet || item.summary || "",
			pubDate: item.pubDate!,
			source,
		}));
};

// Function to check if an article is AI-related using config
const isAIRelated = (article: Article): boolean => {
	const config = getConfig();
	const content = `${article.title} ${article.content}`.toLowerCase();
	return config.aiKeywords.some((keyword) => content.includes(keyword));
};

export const fetchRecentArticles = async (
	limit?: number
): Promise<Article[]> => {
	const config = getConfig();
	const maxArticles = limit || config.maxTotalArticles;
	const allArticles: Article[] = [];

	if (config.rssFeeds.length === 0) {
		console.log("📡 No RSS feeds configured.");
		console.log("💡 To add RSS feeds, you can:");
		console.log("   1. Set the RSS_FEEDS environment variable:");
		console.log(
			"      RSS_FEEDS=https://feeds.feedburner.com/TechCrunch/,https://feeds.arstechnica.com/arstechnica/index"
		);
		console.log("   2. Or modify the defaultConfig in src/config.ts");
		console.log("   3. Or create a .env file with your RSS feeds");
		return allArticles;
	}

	const articlesPerFeed = Math.max(
		3,
		Math.ceil(maxArticles / config.rssFeeds.length)
	);

	for (const feedUrl of config.rssFeeds) {
		try {
			console.log(`📡 Fetching from: ${feedUrl}`);
			const feed: RSSFeed = await parser.parseURL(feedUrl);

			// Get recent articles
			const recentArticles: Article[] = processFeedItems(
				feed.items.slice(0, articlesPerFeed * 2), // Fetch more to account for AI filtering
				feed.title || new URL(feedUrl).hostname
			);

			allArticles.push(...recentArticles);
		} catch (error) {
			console.error(
				`❌ Error fetching from ${feedUrl}:`,
				error instanceof Error ? error.message : "Unknown error"
			);
			continue;
		}
	}

	// Sort by publication date (newest first), remove duplicates, and filter for AI-related content
	const uniqueArticles = removeDuplicates(allArticles);
	const aiArticles = uniqueArticles.filter(isAIRelated);

	console.log(
		`🤖 Found ${aiArticles.length} AI-related articles out of ${uniqueArticles.length} total articles`
	);

	const filteredArticles = aiArticles
		.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
		.slice(0, maxArticles);

	return filteredArticles;
};
