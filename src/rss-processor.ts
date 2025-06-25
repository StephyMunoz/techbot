import Parser from "rss-parser";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
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

const extractArticleContent = async (url: string): Promise<string | null> => {
	try {
		const response = await fetch(url);
		const html = await response.text();
		const dom = new JSDOM(html);

		// Try to find the main content
		const selectors = [
			"article",
			'[role="main"]',
			".content",
			".post-content",
			".article-content",
			"main",
		];

		for (const selector of selectors) {
			const element = dom.window.document.querySelector(selector);
			if (element) {
				return element.textContent?.trim() || "";
			}
		}

		// Fallback to body content
		return dom.window.document.body.textContent?.trim() || "";
	} catch (error) {
		console.error(
			`❌ Error extracting content from ${url}:`,
			error instanceof Error ? error.message : "Unknown error"
		);
		return null;
	}
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

// Dynamic RSS feed discovery - you can implement your own logic here
const getDynamicRSSFeeds = (): string[] => {
	// This is where you can implement your own RSS feed discovery logic
	// For example:
	// - Read from a configuration file
	// - Fetch from an API
	// - Use environment variables
	// - Implement RSS feed discovery algorithms

	// For now, return an empty array - you can implement your own sources
	return [];
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
