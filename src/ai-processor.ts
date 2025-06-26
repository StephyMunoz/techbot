import fetch from "node-fetch";
import { Article } from "./types.js";
import { ArticleHistoryManager } from "./article-history.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateContent = async (
  prompt: string,
  retryCount = 0
): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    // Use Gemini 2.0 Flash free tier model - much better rate limits than 1.5 Pro
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429) {
      if (retryCount < 3) {
        // Exponential backoff: 10s, 20s, 40s
        const waitTime = Math.pow(2, retryCount) * 10000;
        console.log(
          `⏳ Rate limited. Waiting ${waitTime / 1000} seconds before retry ${
            retryCount + 1
          }/3...`
        );
        await delay(waitTime);
        return await generateContent(prompt, retryCount + 1);
      } else {
        throw new Error(
          "Rate limited after 3 retries - please try again later"
        );
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error("No valid response from API");
  } catch (error) {
    console.error(
      "❌ Error generating AI content:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Failed to generate AI content");
  }
};

export const generateSummary = async (content: string): Promise<string> => {
  const prompt = `
    Please provide a concise, engaging summary of the following article content. 
    Focus on the key technical insights and main points that would be relevant to a software development team.
    Keep the summary to 2-3 sentences maximum.
    
    Article content:
    ${content.substring(0, 2000)} // Limit content length for API
    
    Summary:`;

  return await generateContent(prompt);
};

export const generateDiscussionQuestion = async (
  content: string,
  summary: string
): Promise<string> => {
  const prompt = `
    Based on the following article content and summary, generate a thought-provoking question 
    that would encourage technical discussion and collaboration within a software development team.
    
    The question should:
    - Be relevant to the article's technical content
    - Encourage team members to share their experiences and opinions
    - Foster learning and knowledge sharing
    - Be specific enough to generate meaningful discussion
    - Be open-ended but focused
    
    Article content: ${content.substring(0, 1500)}
    Summary: ${summary}
    
    Discussion question:`;

  return await generateContent(prompt);
};

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

  // Enhanced prompt for better article selection with freshness consideration
  const prompt = `
    You are a senior AI/ML engineer and technology analyst tasked with selecting the most valuable and impactful article for a development team focused on AI and software engineering.
    
    Analyze the following articles and select the ONE that would be most valuable for developers, engineers, and tech professionals to discuss and learn from.
    
    Prioritize articles based on:
    1. **Technical Innovation & Breakthroughs** - New AI models, algorithms, or research findings
    2. **Industry Impact & Business Relevance** - Major announcements, funding, partnerships
    3. **Developer Tools & Practical Applications** - New frameworks, APIs, development tools
    4. **Educational Value** - Deep insights, tutorials, or analysis that helps developers grow
    5. **Timeliness & Breaking News** - Recent developments that affect the AI/tech landscape
    6. **Source Authority** - Articles from reputable sources (OpenAI, Google, academic institutions, etc.)
    7. **Content Freshness** - Prefer newer articles and avoid repetitive topics
    
    Consider these factors:
    - Prefer research breakthroughs over general news
    - Favor articles with actionable insights for developers
    - Prioritize content that sparks meaningful technical discussion
    - Value articles that explain complex concepts clearly
    - Consider long-term implications for software development
    - Ensure variety in topics and sources for engaging content
    
    Articles to evaluate:
    ${candidateArticles
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
      candidateArticles.length
    }) of the most relevant and valuable article for a technical audience. Consider the source credibility, technical depth, novelty, and potential for meaningful discussion.`;

  try {
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

      // Enhanced fallback: prioritize by source authority, recency, and uniqueness
      const sourceScores: { [key: string]: number } = {
        OpenAI: 10,
        "Google AI": 10,
        "Google Research": 9,
        "Berkeley AI Research": 9,
        "CMU ML Blog": 9,
        "MIT Technology Review": 8,
        arXiv: 8,
        NVIDIA: 7,
        "Microsoft Research": 7,
        TensorFlow: 7,
        TechCrunch: 6,
        VentureBeat: 6,
        "The Verge": 5,
        "Ars Technica": 5,
      };

      // Score articles based on multiple factors
      const scoredArticles = candidateArticles.map((article) => {
        const sourceScore = sourceScores[article.source] || 3;
        const daysSincePublished = Math.floor(
          (Date.now() - new Date(article.pubDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const recencyScore = Math.max(0, 10 - daysSincePublished); // More recent = higher score
        const contentLength = article.content.length;
        const contentScore = Math.min(5, contentLength / 200); // Favor substantial content

        // Add randomness to ensure variety
        const randomBonus = Math.random() * 2; // 0-2 random points

        return {
          article,
          score: sourceScore + recencyScore + contentScore + randomBonus,
        };
      });

      // Return the highest scored article
      const bestArticle = scoredArticles.sort((a, b) => b.score - a.score)[0];
      console.log(
        `📊 Selected "${bestArticle.article.title}" from ${
          bestArticle.article.source
        } (score: ${bestArticle.score.toFixed(1)})`
      );
      return bestArticle.article;
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

    // Same enhanced fallback logic as above
    const sourceScores: { [key: string]: number } = {
      OpenAI: 10,
      "Google AI": 10,
      "Google Research": 9,
      "Berkeley AI Research": 9,
      "CMU ML Blog": 9,
      "MIT Technology Review": 8,
      arXiv: 8,
      NVIDIA: 7,
      "Microsoft Research": 7,
      TensorFlow: 7,
      TechCrunch: 6,
      VentureBeat: 6,
      "The Verge": 5,
      "Ars Technica": 5,
    };

    const scoredArticles = candidateArticles.map((article) => {
      const sourceScore = sourceScores[article.source] || 3;
      const daysSincePublished = Math.floor(
        (Date.now() - new Date(article.pubDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 10 - daysSincePublished);
      const contentLength = article.content.length;
      const contentScore = Math.min(5, contentLength / 200);
      const randomBonus = Math.random() * 2;

      return {
        article,
        score: sourceScore + recencyScore + contentScore + randomBonus,
      };
    });

    const bestArticle = scoredArticles.sort((a, b) => b.score - a.score)[0];
    console.log(
      `📊 Fallback selected: "${bestArticle.article.title}" from ${bestArticle.article.source}`
    );
    return bestArticle.article;
  }
};
