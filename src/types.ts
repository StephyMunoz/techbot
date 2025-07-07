export interface Article {
  title: string;
  link: string;
  content: string;
  pubDate: string;
  source: string;
}

export interface ProcessedArticle {
  title: string;
  summary: string;
  question: string;
  link: string;
}

export interface RSSFeed {
  title?: string;
  items: RSSItem[];
}

export interface RSSItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  pubDate?: string;
}

export interface SlackMessage {
  title: string;
  summary: string;
  question: string;
  link: string;
}

export interface AIResponse {
  summary: string;
  question: string;
}

export interface ArticleHistory {
  selectedArticles: string[]; // Array of article URLs that have been selected
  lastRun: string; // ISO timestamp of last run
  maxHistorySize: number; // Maximum number of articles to remember
}

/**
 * Configuration constants for the TechBot application
 */
export const CONSTANTS = {
  AI_PROCESSOR: {
    MAX_RETRIES: 3,
    BASE_RETRY_DELAY: 10000, // 10 seconds
    MAX_OUTPUT_TOKENS: 1024,
    TEMPERATURE: 0.2,
    TOP_P: 0.8,
    TOP_K: 40,
    CONTENT_PREVIEW_LENGTH: 2000,
    SUMMARY_CONTENT_LENGTH: 1500,
  },
  HISTORY: {
    MAX_SIZE: 50,
    FORCE_REFRESH_HOURS: 24,
    HISTORY_FILE: ".techbot-history.json",
  },
  RSS: {
    DEFAULT_ARTICLES_PER_FEED: 5,
    MIN_CONTENT_LENGTH: 100,
    CONCURRENT_FEEDS: 10,
  },
  SCORING: {
    MAX_RECENCY_DAYS: 10,
    CONTENT_LENGTH_DIVISOR: 200,
    TECHNICAL_KEYWORD_WEIGHT: 0.5,
    MAX_RANDOM_BONUS: 2,
  },
} as const;

/**
 * Custom error types for better error handling
 */
export class TechBotError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = "TechBotError";
  }
}

export class APIError extends TechBotError {
  constructor(message: string, public statusCode?: number, cause?: Error) {
    super(message, "API_ERROR", cause);
    this.name = "APIError";
  }
}

export class ConfigurationError extends TechBotError {
  constructor(message: string, cause?: Error) {
    super(message, "CONFIG_ERROR", cause);
    this.name = "ConfigurationError";
  }
}

/**
 * Source priority mapping for article selection
 */
export const SOURCE_SCORES: Record<string, number> = {
  // Research and technical sources
  OpenAI: 10,
  "Google AI": 10,
  "Google Research": 9,
  "Berkeley AI Research": 9,
  "CMU ML Blog": 9,
  arXiv: 9,
  "Microsoft Research": 8,
  "MIT Technology Review": 8,
  "Stanford AI Lab": 8,

  // Developer-focused sources
  "GitHub Blog": 8,
  "Stack Overflow": 7,
  "Dev.to": 7,
  "Medium - Towards Data Science": 7,
  "Real Python": 7,
  "PyTorch Blog": 8,
  "TensorFlow Blog": 8,
  "Hugging Face": 8,

  // Tech news with technical depth
  "Ars Technica": 6,
  "The Verge": 5,
  TechCrunch: 5,
  VentureBeat: 5,
  Wired: 5,
} as const;

/**
 * Technical keywords for relevance scoring
 */
export const TECHNICAL_KEYWORDS = [
  "api",
  "framework",
  "library",
  "implementation",
  "architecture",
  "deployment",
  "performance",
  "scalability",
  "optimization",
  "integration",
  "code",
  "algorithm",
  "model",
  "training",
  "inference",
  "pipeline",
  "infrastructure",
  "testing",
  "debugging",
  "monitoring",
  "security",
] as const;
