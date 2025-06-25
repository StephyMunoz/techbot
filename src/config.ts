// Configuration for RSS feeds and news sources
export interface NewsConfig {
	rssFeeds: string[];
	aiKeywords: string[];
	maxArticlesPerFeed: number;
	maxTotalArticles: number;
}

// Default configuration
export const defaultConfig: NewsConfig = {
	rssFeeds: [
		// Add your RSS feeds here
		// Example: "https://feeds.feedburner.com/TechCrunch/",
	],
	aiKeywords: [
		"ai",
		"artificial intelligence",
		"machine learning",
		"ml",
		"deep learning",
		"neural network",
		"llm",
		"large language model",
		"gpt",
		"chatgpt",
		"openai",
		"claude",
		"anthropic",
		"gemini",
		"google ai",
		"microsoft ai",
		"azure ai",
		"aws ai",
		"tensorflow",
		"pytorch",
		"automation",
		"robotics",
		"computer vision",
		"nlp",
		"natural language processing",
		"data science",
		"algorithm",
	],
	maxArticlesPerFeed: 5,
	maxTotalArticles: 10,
};

// Function to load configuration from environment variables
export const loadConfigFromEnv = (): NewsConfig => {
	const config = { ...defaultConfig };

	// Load RSS feeds from environment variable
	const rssFeedsEnv = process.env.RSS_FEEDS;
	if (rssFeedsEnv) {
		config.rssFeeds = rssFeedsEnv
			.split(",")
			.map((feed) => feed.trim())
			.filter((feed) => feed.length > 0);
	}

	// Load AI keywords from environment variable
	const aiKeywordsEnv = process.env.AI_KEYWORDS;
	if (aiKeywordsEnv) {
		config.aiKeywords = aiKeywordsEnv
			.split(",")
			.map((keyword) => keyword.trim())
			.filter((keyword) => keyword.length > 0);
	}

	// Load numeric configs
	const maxArticlesPerFeed = process.env.MAX_ARTICLES_PER_FEED;
	if (maxArticlesPerFeed) {
		config.maxArticlesPerFeed = parseInt(maxArticlesPerFeed, 10);
	}

	const maxTotalArticles = process.env.MAX_TOTAL_ARTICLES;
	if (maxTotalArticles) {
		config.maxTotalArticles = parseInt(maxTotalArticles, 10);
	}

	return config;
};

// Function to get current configuration
export const getConfig = (): NewsConfig => {
	return loadConfigFromEnv();
};
