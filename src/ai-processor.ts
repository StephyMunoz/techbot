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
				throw new Error("Rate limited after 3 retries - please try again later");
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
    You are a senior AI/ML engineer creating summaries for software developers. 
    
    Please provide a concise, technical summary of the following AI-related article that focuses on:
    - Key technical innovations or breakthroughs in AI/ML
    - Practical implications for software development and engineering
    - New tools, frameworks, or APIs that developers can use
    - Technical challenges and solutions discussed
    - Industry trends that affect software development practices
    
    Keep the summary to 2-3 sentences maximum, focusing on what software developers need to know.
    
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
    
    Article content: ${content.substring(0, 1500)}
    Summary: ${summary}
    
    Light discussion question:`;

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
		const unselectedArticles = historyManager.filterUnselectedArticles(articles);

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

	// Enhanced prompt specifically for software developers and AI/ML engineers
	const prompt = `
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
				}) of the most technically relevant and valuable article for software developers working with AI technologies. Focus on practical, actionable content that helps developers build better AI systems.`;

	try {
		const response = await generateContent(prompt);
		const selectedIndex = parseInt(response.trim()) - 1;

		if (
			isNaN(selectedIndex) ||
			selectedIndex < 0 ||
			selectedIndex >= candidateArticles.length
		) {
			console.log("⚠️  AI selection was invalid, using fallback selection logic");

			// Enhanced fallback: prioritize by technical relevance and developer-focused sources
			const sourceScores: { [key: string]: number } = {
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
			};

			// Score articles based on technical relevance and developer focus
			const scoredArticles = candidateArticles.map((article) => {
				const sourceScore = sourceScores[article.source] || 3;
				const daysSincePublished = Math.floor(
					(Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24)
				);
				const recencyScore = Math.max(0, 10 - daysSincePublished);
				const contentLength = article.content.length;
				const contentScore = Math.min(5, contentLength / 200);

				// Technical relevance scoring
				const technicalKeywords = [
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
				];
				const technicalScore =
					technicalKeywords.filter((keyword) =>
						article.content.toLowerCase().includes(keyword)
					).length * 0.5;

				const randomBonus = Math.random() * 2;

				return {
					article,
					score:
						sourceScore + recencyScore + contentScore + technicalScore + randomBonus,
				};
			});

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
			arXiv: 9,
			"Microsoft Research": 8,
			"MIT Technology Review": 8,
			"Stanford AI Lab": 8,
			"GitHub Blog": 8,
			"Stack Overflow": 7,
			"Dev.to": 7,
			"Medium - Towards Data Science": 7,
			"Real Python": 7,
			"PyTorch Blog": 8,
			"TensorFlow Blog": 8,
			"Hugging Face": 8,
			"Ars Technica": 6,
			"The Verge": 5,
			TechCrunch: 5,
			VentureBeat: 5,
			Wired: 5,
		};

		const scoredArticles = candidateArticles.map((article) => {
			const sourceScore = sourceScores[article.source] || 3;
			const daysSincePublished = Math.floor(
				(Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24)
			);
			const recencyScore = Math.max(0, 10 - daysSincePublished);
			const contentLength = article.content.length;
			const contentScore = Math.min(5, contentLength / 200);

			const technicalKeywords = [
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
			];
			const technicalScore =
				technicalKeywords.filter((keyword) =>
					article.content.toLowerCase().includes(keyword)
				).length * 0.5;

			const randomBonus = Math.random() * 2;

			return {
				article,
				score:
					sourceScore + recencyScore + contentScore + technicalScore + randomBonus,
			};
		});

		const bestArticle = scoredArticles.sort((a, b) => b.score - a.score)[0];
		console.log(
			`📊 Fallback selected: "${bestArticle.article.title}" from ${bestArticle.article.source}`
		);
		return bestArticle.article;
	}
};
