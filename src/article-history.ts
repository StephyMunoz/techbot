import { ArticleHistory, CONSTANTS } from "./types.js";
import { promises as fs } from "fs";
import path from "path";

const HISTORY_FILE = path.join(process.cwd(), CONSTANTS.HISTORY.HISTORY_FILE);

/**
 * Manages article history to avoid selecting duplicate articles
 */
export class ArticleHistoryManager {
  private history: ArticleHistory;

  constructor() {
    this.history = {
      selectedArticles: [],
      lastRun: new Date().toISOString(),
      maxHistorySize: CONSTANTS.HISTORY.MAX_SIZE,
    };
  }

  /**
   * Load history from file system
   */
  async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(HISTORY_FILE, "utf-8");
      const parsed = JSON.parse(data) as ArticleHistory;

      // Validate the loaded data
      if (parsed.selectedArticles && Array.isArray(parsed.selectedArticles)) {
        this.history = {
          selectedArticles: parsed.selectedArticles,
          lastRun: parsed.lastRun || new Date().toISOString(),
          maxHistorySize: parsed.maxHistorySize || CONSTANTS.HISTORY.MAX_SIZE,
        };

        // Trim history if it's too large
        if (
          this.history.selectedArticles.length > this.history.maxHistorySize
        ) {
          this.history.selectedArticles = this.history.selectedArticles.slice(
            -this.history.maxHistorySize
          );
        }
      }
    } catch (error) {
      // File doesn't exist or is corrupted, use default
      console.log("📝 Creating new article history file");
    }
  }

  /**
   * Save history to file system
   */
  async saveHistory(): Promise<void> {
    try {
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error("⚠️  Failed to save article history:", error);
    }
  }

  /**
   * Check if an article has been selected before
   */
  hasBeenSelected(articleUrl: string): boolean {
    return this.history.selectedArticles.includes(articleUrl);
  }

  /**
   * Add an article to the selection history
   */
  addSelectedArticle(articleUrl: string): void {
    // Remove if already exists to avoid duplicates
    this.history.selectedArticles = this.history.selectedArticles.filter(
      (url) => url !== articleUrl
    );

    // Add to the end
    this.history.selectedArticles.push(articleUrl);

    // Trim if too large
    if (this.history.selectedArticles.length > this.history.maxHistorySize) {
      this.history.selectedArticles = this.history.selectedArticles.slice(
        -this.history.maxHistorySize
      );
    }

    // Update last run time
    this.history.lastRun = new Date().toISOString();
  }

  /**
   * Filter articles to only include those that haven't been selected before
   */
  filterUnselectedArticles<T extends { link: string }>(articles: T[]): T[] {
    return articles.filter((article) => !this.hasBeenSelected(article.link));
  }

  /**
   * Get history statistics
   */
  getStats(): {
    totalSelected: number;
    lastRun: string;
    oldestInHistory: string | null;
  } {
    const oldestInHistory =
      this.history.selectedArticles.length > 0
        ? this.history.selectedArticles[0]
        : null;

    return {
      totalSelected: this.history.selectedArticles.length,
      lastRun: this.history.lastRun,
      oldestInHistory,
    };
  }

  /**
   * Clear all history (useful for testing or reset)
   */
  async clearHistory(): Promise<void> {
    this.history = {
      selectedArticles: [],
      lastRun: new Date().toISOString(),
      maxHistorySize: CONSTANTS.HISTORY.MAX_SIZE,
    };
    await this.saveHistory();
  }

  /**
   * Get time since last run in milliseconds
   */
  getTimeSinceLastRun(): number {
    return Date.now() - new Date(this.history.lastRun).getTime();
  }

  /**
   * Check if we should force refresh (e.g., if it's been more than 24 hours)
   */
  shouldForceRefresh(): boolean {
    const hoursSinceLastRun = this.getTimeSinceLastRun() / (1000 * 60 * 60);
    return hoursSinceLastRun > CONSTANTS.HISTORY.FORCE_REFRESH_HOURS;
  }
}
