import { SlackMessage } from "./types.js";

/**
 * Formats a message for Slack with proper structure and emojis
 * @param data - The message data containing title, summary, question, and link
 * @returns Formatted string ready for Slack posting
 */
export const formatSlackMessage = (data: SlackMessage): string => {
  // Validate input data
  if (!data.title || !data.summary || !data.question || !data.link) {
    throw new Error("Missing required fields for Slack message formatting");
  }

  // Ensure proper formatting and prevent XSS
  const safeTitle = data.title.trim().replace(/[<>]/g, "");
  const safeSummary = data.summary.trim();
  const safeQuestion = data.question.trim();
  const safeLink = data.link.trim();

  return `🤖 TechBot - Daily News
📰 ${safeTitle}
Summary: ${safeSummary}
🔗 [Read article](${safeLink})
💬 Question for the team:
${safeQuestion}`;
};
