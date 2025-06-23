import { SlackMessage } from "./types";

export const formatSlackMessage = (data: SlackMessage): string => {
	return `🤖 TechBot - Daily News
📰 ${data.title}
Summary: ${data.summary}
🔗 [Read article](${data.link})
💬 Question for the team:
${data.question}`;
};
