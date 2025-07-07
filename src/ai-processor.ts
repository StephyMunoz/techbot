import fetch, { Response } from "node-fetch";
import {
  Article,
  CONSTANTS,
  APIError,
  ConfigurationError,
  SOURCE_SCORES,
  TECHNICAL_KEYWORDS,
} from "./types.js";
import { ArticleHistoryManager } from "./article-history.js";

/**
 * Utility function to delay execution
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates the API key is available
 */
const validateAPIKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ConfigurationError(
      "GEMINI_API_KEY not found in environment variables"
    );
  }
  return apiKey;
};

/**
 * Builds the request configuration for the Gemini API
 */
const buildGeminiRequest = (prompt: string) => {
  return {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: CONSTANTS.AI_PROCESSOR.TEMPERATURE,
      maxOutputTokens: CONSTANTS.AI_PROCESSOR.MAX_OUTPUT_TOKENS,
      topP: CONSTANTS.AI_PROCESSOR.TOP_P,
      topK: CONSTANTS.AI_PROCESSOR.TOP_K,
    },
  };
};

/**
 * Handles API response and extracts content
 */
const extractAPIResponse = async (response: Response): Promise<string> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new APIError(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new APIError("No valid response from API");
};

/**
 * Core function to generate content using Gemini API with retry logic
 */
const generateContent = async (
  prompt: string,
  retryCount = 0
): Promise<string> => {
  try {
    const apiKey = validateAPIKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGeminiRequest(prompt)),
    });

    if (response.status === 429) {
      if (retryCount < CONSTANTS.AI_PROCESSOR.MAX_RETRIES) {
        // Exponential backoff
        const waitTime =
          Math.pow(2, retryCount) * CONSTANTS.AI_PROCESSOR.BASE_RETRY_DELAY;
        console.log(
          `⏳ Rate limited. Waiting ${waitTime / 1000} seconds before retry ${
            retryCount + 1
          }/${CONSTANTS.AI_PROCESSOR.MAX_RETRIES}...`
        );
        await delay(waitTime);
        return await generateContent(prompt, retryCount + 1);
      } else {
        throw new APIError(
          `Rate limited after ${CONSTANTS.AI_PROCESSOR.MAX_RETRIES} retries - please try again later`,
          429
        );
      }
    }

    return await extractAPIResponse(response);
  } catch (error) {
    if (error instanceof APIError || error instanceof ConfigurationError) {
      throw error;
    }

    console.error(
      "❌ Error generating AI content:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new APIError(
      "Failed to generate AI content",
      undefined,
      error as Error
    );
  }
};

/**
 * Generates a technical summary of an article for developers
 */
export const generateSummary = async (content: string): Promise<string> => {
  const prompt = `
    You are a senior AI/ML engineer creating summaries for software developers. 
    
    Please provide a concise, technical summary of the following AI-related article that focuses on:
    - Key technical innovations or breakthroughs in AI/ML
    - Practical implications for software development and engineering
    - New tools, frameworks, or APIs that developers can use
    - Technical challenges and solutions discussed
    - Industry trends that affect software development practices
    
    Keep the summary to 2-3 sentences maximum, focusing on what software developers need to know.
    
    Article content:
    ${content.substring(0, CONSTANTS.AI_PROCESSOR.CONTENT_PREVIEW_LENGTH)}
    
    Summary:`;

  return await generateContent(prompt);
};

/**
 * Generates an engaging discussion question for development teams
 */
export const generateDiscussionQuestion = async (
  content: string,
  summary: string
): Promise<string> => {
  const prompt = `
    You are creating a light, engaging discussion question for a software development team.
    
    Based on the following AI-related article, generate a simple, conversational question that:
    - Is easy to understand and answer
    - Encourages casual team discussion
    - Relates to the article in a fun, approachable way
    - Can be answered by anyone on the team (not just AI experts)
    - Starts a light conversation, not a deep technical debate
    
    The question should be:
    - Short and simple (1-2 sentences max)
    - Conversational in tone
    - Something people can share personal opinions about
    - Related to the article but not too technical
    - Fun and engaging
    
    Examples of good light questions:
    - "What's your favorite AI tool you've tried recently?"
    - "How do you think AI will change the way we work in the next year?"
    - "What's the most surprising thing you've seen AI do lately?"
    - "If you could have an AI assistant for one task, what would it be?"
    
    Article content: ${content.substring(
      0,
      CONSTANTS.AI_PROCESSOR.SUMMARY_CONTENT_LENGTH
    )}
    Summary: ${summary}
    
    Light discussion question:`;

  return await generateContent(prompt);
};

/**
 * Calculates relevance score for an article based on multiple factors
 */
const calculateArticleScore = (article: Article): number => {
  const sourceScore = SOURCE_SCORES[article.source] || 3;

  const daysSincePublished = Math.floor(
    (Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(
    0,
    CONSTANTS.SCORING.MAX_RECENCY_DAYS - daysSincePublished
  );

  const contentScore = Math.min(
    5,
    article.content.length / CONSTANTS.SCORING.CONTENT_LENGTH_DIVISOR
  );

  const technicalScore =
    TECHNICAL_KEYWORDS.filter((keyword) =>
      article.content.toLowerCase().includes(keyword)
    ).length * CONSTANTS.SCORING.TECHNICAL_KEYWORD_WEIGHT;

  const randomBonus = Math.random() * CONSTANTS.SCORING.MAX_RANDOM_BONUS;

  return (
    sourceScore + recencyScore + contentScore + technicalScore + randomBonus
  );
};

/**
 * Fallback article selection using scoring algorithm
 */
const selectArticleByScore = (articles: Article[]): Article => {
  const scoredArticles = articles.map((article) => ({
    article,
    score: calculateArticleScore(article),
  }));

  const bestArticle = scoredArticles.sort((a, b) => b.score - a.score)[0];
  console.log(
    `📊 Selected "${bestArticle.article.title}" from ${
      bestArticle.article.source
    } (score: ${bestArticle.score.toFixed(1)})`
  );

  return bestArticle.article;
};

/**
 * Builds the article selection prompt for the AI
 */
const buildSelectionPrompt = (articles: Article[]): string => {
  return `
    You are a senior AI/ML engineer and software architect selecting the most valuable AI-related article for a development team.
    
    Your team consists of software developers, ML engineers, DevOps engineers, and technical leads who need to stay current with AI technologies that impact their work.
    
    Analyze the following AI-related articles and select the ONE that would be most valuable for software development professionals to discuss and learn from.
    
    **Prioritize articles based on:**
    
    1. **Technical Innovation & Developer Tools** - New AI frameworks, libraries, APIs, or development tools
    2. **Implementation & Architecture** - Practical guidance on building AI systems, deployment strategies, or architectural patterns
    3. **Performance & Scalability** - Optimization techniques, infrastructure considerations, or scaling challenges
    4. **Industry Standards & Best Practices** - New methodologies, standards, or proven approaches in AI development
    5. **Developer Experience & Workflow** - Tools that improve developer productivity, debugging, or testing in AI projects
    6. **Integration & APIs** - New AI services, APIs, or integration patterns for existing applications
    7. **Research with Practical Applications** - Academic breakthroughs that have immediate implications for software development
    
    **Consider these technical factors:**
    - Does it provide actionable insights for developers?
    - Does it discuss implementation challenges and solutions?
    - Does it introduce new tools or frameworks developers can use?
    - Does it address real-world deployment and production concerns?
    - Does it help developers understand emerging AI technologies?
    - Does it discuss performance, security, or scalability aspects?
    - Does it provide code examples, architecture diagrams, or technical specifications?
    
    **Avoid articles that are:**
    - Purely business/marketing focused without technical depth
    - General AI news without developer-relevant details
    - Speculative future predictions without current technical implications
    - Company announcements without technical implementation details
    
    Articles to evaluate:
    ${articles
      .map(
        (article, index) => `
    ${index + 1}. Title: "${article.title}"
       Source: ${article.source}
       Published: ${new Date(article.pubDate).toLocaleDateString()}
       Content Preview: ${article.content.substring(0, 400)}...
       URL: ${article.link}
    `
      )
      .join("\n")}
    
    Respond with ONLY the number (1-${
      articles.length
    }) of the most technically relevant and valuable article for software developers working with AI technologies. Focus on practical, actionable content that helps developers build better AI systems.`;
};

/**
 * Selects the most relevant article using AI analysis with history awareness
 */
export const selectMostRelevantArticle = async (
  articles: Article[],
  historyManager?: ArticleHistoryManager
): Promise<Article> => {
  if (articles.length === 0) {
    throw new Error("No articles provided for selection");
  }

  // Filter out previously selected articles if history manager is provided
  let candidateArticles = articles;
  if (historyManager) {
    const unselectedArticles =
      historyManager.filterUnselectedArticles(articles);

    if (unselectedArticles.length > 0) {
      candidateArticles = unselectedArticles;
      console.log(
        `🔄 Filtered to ${candidateArticles.length} new articles (${
          articles.length - candidateArticles.length
        } previously selected)`
      );
    } else {
      console.log(
        "⚠️  All articles have been selected before. Using all articles but will prioritize different sources."
      );
      candidateArticles = articles;
    }
  }

  if (candidateArticles.length === 1) {
    return candidateArticles[0];
  }

  try {
    const prompt = buildSelectionPrompt(candidateArticles);
    const response = await generateContent(prompt);
    const selectedIndex = parseInt(response.trim()) - 1;

    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= candidateArticles.length
    ) {
      console.log(
        "⚠️  AI selection was invalid, using fallback selection logic"
      );
      return selectArticleByScore(candidateArticles);
    }

    const selectedArticle = candidateArticles[selectedIndex];
    console.log(
      `🎯 AI selected: "${selectedArticle.title}" from ${selectedArticle.source}`
    );
    return selectedArticle;
  } catch (error) {
    console.log(
      "⚠️  Error in AI article selection, using fallback selection logic"
    );
    console.error(
      "Selection error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return selectArticleByScore(candidateArticles);
  }
};
