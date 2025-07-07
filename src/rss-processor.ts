import Parser from "rss-parser";
import { Article, RSSFeed, RSSItem, CONSTANTS } from "./types.js";
import { getConfig } from "./config.js";

const parser = new Parser();

/**
 * Remove duplicate articles based on title
 */
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

/**
 * Process RSS feed items and convert to Article objects
 */
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

/**
 * Enhanced function to check if an article is AI-related
 */
const isAIRelated = (article: Article): boolean => {
  const config = getConfig();
  const content = `${article.title} ${article.content}`.toLowerCase();

  // Check for AI keywords
  const hasAIKeywords = config.aiKeywords.some((keyword) =>
    content.includes(keyword.toLowerCase())
  );

  // Additional checks for development/tech relevance
  const techKeywords = [
    "software",
    "programming",
    "development",
    "code",
    "api",
    "framework",
    "cloud",
    "data",
    "analytics",
    "tech",
    "innovation",
    "startup",
  ];

  const hasTechKeywords = techKeywords.some((keyword) =>
    content.includes(keyword)
  );

  // Prioritize articles that are both AI-related AND tech/dev focused
  return (
    hasAIKeywords ||
    (hasTechKeywords && content.length > CONSTANTS.RSS.MIN_CONTENT_LENGTH)
  );
};

/**
 * Domain to friendly name mapping for better source identification
 */
const DOMAIN_NAME_MAP: Record<string, string> = {
  "openai.com": "OpenAI",
  "ai.googleblog.com": "Google AI",
  "research.google": "Google Research",
  "bair.berkeley.edu": "Berkeley AI Research",
  "blog.ml.cmu.edu": "CMU ML Blog",
  "techcrunch.com": "TechCrunch",
  "arstechnica.com": "Ars Technica",
  "theverge.com": "The Verge",
  "technologyreview.com": "MIT Technology Review",
  "venturebeat.com": "VentureBeat",
  "machinelearningmastery.com": "ML Mastery",
  "towardsdatascience.com": "Towards Data Science",
  "analyticsvidhya.com": "Analytics Vidhya",
  "distill.pub": "Distill",
  "arxiv.org": "arXiv",
  "blogs.nvidia.com": "NVIDIA",
  "microsoft.com": "Microsoft Research",
  "blog.tensorflow.org": "TensorFlow",
  "marktechpost.com": "MarkTechPost",
  "unite.ai": "Unite.AI",
  "analyticsindiamag.com": "Analytics India",
  "artificialintelligence-news.com": "AI News",
  "stackoverflow.blog": "Stack Overflow",
  "github.blog": "GitHub",
  "zdnet.com": "ZDNet",
} as const;

/**
 * Function to get friendly feed name from URL
 */
const getFeedName = (feedUrl: string): string => {
  try {
    const url = new URL(feedUrl);
    const hostname = url.hostname.replace("www.", "");
    return DOMAIN_NAME_MAP[hostname] || hostname;
  } catch {
    return feedUrl;
  }
};

/**
 * Fetch a single RSS feed with timeout and error handling
 */
const fetchSingleFeed = async (
  feedUrl: string,
  articlesPerFeed: number
): Promise<{ articles: Article[]; success: boolean; error?: string }> => {
  try {
    const feedName = getFeedName(feedUrl);
    console.log(`📰 Fetching: ${feedName}`);

    const feed: RSSFeed = await parser.parseURL(feedUrl);

    // Get recent articles
    const recentArticles: Article[] = processFeedItems(
      feed.items.slice(0, articlesPerFeed * 2), // Fetch more to account for filtering
      feedName
    );

    return { articles: recentArticles, success: true };
  } catch (error) {
    const feedName = getFeedName(feedUrl);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Error fetching from ${feedName}:`, errorMessage);
    return { articles: [], success: false, error: errorMessage };
  }
};

/**
 * Fetch recent articles from multiple RSS feeds
 */
export const fetchRecentArticles = async (
  limit?: number
): Promise<Article[]> => {
  const config = getConfig();
  const maxArticles = limit || config.maxTotalArticles;

  if (config.rssFeeds.length === 0) {
    console.log("📡 No RSS feeds configured.");
    console.log(
      "💡 RSS feeds have been pre-configured with top AI and development sources!"
    );
    return [];
  }

  console.log(`📡 Fetching from ${config.rssFeeds.length} RSS feeds...`);

  // Calculate articles per feed, but ensure we get enough content
  const articlesPerFeed = Math.max(
    CONSTANTS.RSS.DEFAULT_ARTICLES_PER_FEED,
    Math.ceil(maxArticles / config.rssFeeds.length)
  );

  // Process feeds concurrently for better performance
  const feedPromises = config.rssFeeds.map((feedUrl) =>
    fetchSingleFeed(feedUrl, articlesPerFeed)
  );

  const feedResults = await Promise.all(feedPromises);

  // Collect results and statistics
  const allArticles: Article[] = [];
  let successfulFeeds = 0;
  let failedFeeds = 0;

  feedResults.forEach((result) => {
    if (result.success) {
      successfulFeeds++;
      allArticles.push(...result.articles);
    } else {
      failedFeeds++;
    }
  });

  console.log(
    `✅ Successfully fetched from ${successfulFeeds}/${config.rssFeeds.length} feeds`
  );
  if (failedFeeds > 0) {
    console.log(`⚠️  ${failedFeeds} feeds failed to load`);
  }

  // Process articles: remove duplicates, filter for relevance, and sort
  const uniqueArticles = removeDuplicates(allArticles);
  const relevantArticles = uniqueArticles.filter(isAIRelated);

  console.log(
    `🤖 Found ${relevantArticles.length} relevant AI/tech articles out of ${uniqueArticles.length} total articles`
  );

  // Sort by date (newest first) and limit results
  const sortedArticles = relevantArticles
    .sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, maxArticles);

  // Show source statistics
  const sourceStats = sortedArticles.reduce((acc, article) => {
    acc[article.source] = (acc[article.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("📊 Articles by source:", sourceStats);

  return sortedArticles;
};
