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
