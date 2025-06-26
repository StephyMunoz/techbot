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

// Enhanced function to check if an article is AI-related
const isAIRelated = (article: Article): boolean => {
  const config = getConfig();
  const content = `${article.title} ${article.content}`.toLowerCase();

  // Check for AI keywords
  const hasAIKeywords = config.aiKeywords.some((keyword) =>
    content.includes(keyword)
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
  return hasAIKeywords || (hasTechKeywords && content.length > 100);
};

// Function to get feed name from URL for better source identification
const getFeedName = (feedUrl: string): string => {
  try {
    const url = new URL(feedUrl);
    const hostname = url.hostname.replace("www.", "");

    // Map of known domains to friendly names
    const domainMap: { [key: string]: string } = {
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
    };

    return domainMap[hostname] || hostname;
  } catch {
    return new URL(feedUrl).hostname;
  }
};

export const fetchRecentArticles = async (
  limit?: number
): Promise<Article[]> => {
  const config = getConfig();
  const maxArticles = limit || config.maxTotalArticles;
  const allArticles: Article[] = [];

  if (config.rssFeeds.length === 0) {
    console.log("📡 No RSS feeds configured.");
    console.log(
      "💡 RSS feeds have been pre-configured with top AI and development sources!"
    );
    return allArticles;
  }

  console.log(`📡 Fetching from ${config.rssFeeds.length} RSS feeds...`);

  // Calculate articles per feed, but ensure we get enough content
  const articlesPerFeed = Math.max(
    5,
    Math.ceil(maxArticles / config.rssFeeds.length)
  );

  // Track successful and failed feeds
  let successfulFeeds = 0;
  let failedFeeds = 0;

  // Process feeds with some concurrency but not too much to avoid overwhelming servers
  const feedPromises = config.rssFeeds.map(async (feedUrl) => {
    try {
      console.log(`📰 Fetching: ${getFeedName(feedUrl)}`);
      const feed: RSSFeed = await parser.parseURL(feedUrl);

      // Get recent articles
      const recentArticles: Article[] = processFeedItems(
        feed.items.slice(0, articlesPerFeed * 2), // Fetch more to account for filtering
        getFeedName(feedUrl)
      );

      successfulFeeds++;
      return recentArticles;
    } catch (error) {
      failedFeeds++;
      console.error(
        `❌ Error fetching from ${getFeedName(feedUrl)}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      return [];
    }
  });

  // Wait for all feeds to complete
  const allFeedResults = await Promise.all(feedPromises);

  // Flatten results
  allFeedResults.forEach((articles) => {
    allArticles.push(...articles);
  });

  console.log(
    `✅ Successfully fetched from ${successfulFeeds}/${config.rssFeeds.length} feeds`
  );
  if (failedFeeds > 0) {
    console.log(`⚠️  ${failedFeeds} feeds failed to load`);
  }

  // Sort by publication date (newest first), remove duplicates, and filter for relevant content
  const uniqueArticles = removeDuplicates(allArticles);
  const relevantArticles = uniqueArticles.filter(isAIRelated);

  console.log(
    `🤖 Found ${relevantArticles.length} relevant AI/tech articles out of ${uniqueArticles.length} total articles`
  );

  // Sort by date and limit results
  const filteredArticles = relevantArticles
    .sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, maxArticles);

  // Show some stats about sources
  const sourceStats = filteredArticles.reduce((acc, article) => {
    acc[article.source] = (acc[article.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("📊 Articles by source:", sourceStats);

  return filteredArticles;
};
