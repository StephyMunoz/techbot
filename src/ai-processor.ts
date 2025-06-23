import fetch from "node-fetch";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateContent = async (prompt: string): Promise<string> => {
	try {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY not found in environment variables");
		}

		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

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
			console.log("⏳ Rate limited. Waiting 30 seconds before retry...");
			await delay(30000); // Wait 30 seconds
			throw new Error("Rate limited - please try again later");
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
