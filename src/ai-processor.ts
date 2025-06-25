import fetch from "node-fetch";
import { Article } from "./types";

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
	articles: Article[]
): Promise<Article> => {
	if (articles.length === 0) {
		throw new Error("No articles provided for selection");
	}

	if (articles.length === 1) {
		return articles[0];
	}

	const prompt = `
    You are a senior software developer tasked with selecting the most relevant and impactful technology news article for a development team.
    
    Please analyze the following articles and select the ONE that would be most valuable for a software development team to discuss.
    Consider factors like:
    - Technical innovation and advancement
    - Industry impact and relevance
    - Potential for meaningful team discussion
    - Educational value for developers
    - Timeliness and current relevance
    
    Articles to evaluate:
    ${articles
					.map(
						(article, index) => `
    ${index + 1}. "${article.title}"
       Source: ${article.source}
       Content: ${article.content.substring(0, 300)}...
    `
					)
					.join("\n")}
    
    Respond with ONLY the number (1-${
					articles.length
				}) of the most relevant article. No explanation needed, just the number.`;

	try {
		const response = await generateContent(prompt);
		const selectedIndex = parseInt(response.trim()) - 1;

		if (
			isNaN(selectedIndex) ||
			selectedIndex < 0 ||
			selectedIndex >= articles.length
		) {
			console.log("⚠️  AI selection was invalid, falling back to first article");
			return articles[0];
		}

		return articles[selectedIndex];
	} catch (error) {
		console.log(
			"⚠️  Error in AI article selection, falling back to first article"
		);
		return articles[0];
	}
};
