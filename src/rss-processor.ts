import Parser from "rss-parser";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { Article, RSSFeed, RSSItem } from "./types";

const parser = new Parser();

const RSS_FEEDS: string[] = [
	"https://feeds.feedburner.com/TechCrunch/",
	"https://rss.cnn.com/rss/edition_technology.rss",
	"https://feeds.arstechnica.com/arstechnica/index",
	"https://www.wired.com/feed/rss",
	"https://feeds.feedburner.com/venturebeat/SZYF",
];

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
	return items.map((item) => ({
		title: item.title,
		link: item.link,
		content: item.content || item.contentSnippet || item.summary || "",
		pubDate: item.pubDate,
		source,
	}));
};

export const fetchRecentArticles = async (
	limit: number = 3
): Promise<Article[]> => {
	const allArticles: Article[] = [];

	for (const feedUrl of RSS_FEEDS) {
		try {
			console.log(`📡 Fetching from: ${feedUrl}`);
			const feed: RSSFeed = await parser.parseURL(feedUrl);

			// Get the most recent articles
			const recentArticles: Article[] = processFeedItems(
				feed.items.slice(0, limit),
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

	// Sort by publication date (newest first) and remove duplicates
	const uniqueArticles = removeDuplicates(allArticles);
	return uniqueArticles
		.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
		.slice(0, limit);
};
