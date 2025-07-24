import { WebClient } from "@slack/web-api";
import { SlackMessage } from "./types.js";

/**
 * Slack client for posting TechBot messages
 */
export class SlackClient {
  private client: WebClient;
  private channelId: string;

  constructor(token: string, channelId: string) {
    this.client = new WebClient(token);
    this.channelId = channelId;
  }

  /**
   * Post a TechBot message to the configured Slack channel
   */
  async postMessage(message: SlackMessage): Promise<void> {
    try {
      console.log(`📤 Posting message to Slack channel ${this.channelId}...`);

      const result = await this.client.chat.postMessage({
        channel: this.channelId,
        text: message.title, // Fallback text for notifications
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🤖 TechBot - AI & Development News",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📰 ${message.title}*`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📝 Summary:*\n${message.summary}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*💬 Discussion Question:*\n${message.question}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*🔗 Read full article:* ${message.link}`,
            },
          },
          {
            type: "divider",
          },
        ],
      });

      if (result.ok) {
        console.log("✅ Message posted successfully to Slack!");
        console.log(
          `📱 Message URL: ${
            result.ts
              ? `https://slack.com/app_redirect?channel=${this.channelId}&message_ts=${result.ts}`
              : "N/A"
          }`
        );
      } else {
        throw new Error(`Slack API error: ${result.error}`);
      }
    } catch (error: any) {
      // Handle "not_in_channel" error specifically
      if (error.data?.error === "not_in_channel") {
        console.log("⚠️  Bot is not in the channel. Attempting to join...");
        try {
          await this.joinChannel();
          // Retry posting the message
          await this.postMessage(message);
        } catch (joinError) {
          console.error("❌ Failed to join channel:", joinError);
          console.log(
            "💡 Please manually invite the bot to the channel using: /invite @YourBotName"
          );
          throw error;
        }
      } else {
        console.error("❌ Failed to post message to Slack:", error);
        throw error;
      }
    }
  }

  /**
   * Join the configured channel
   */
  private async joinChannel(): Promise<void> {
    try {
      const result = await this.client.conversations.join({
        channel: this.channelId,
      });

      if (result.ok) {
        console.log("✅ Successfully joined the channel!");
      } else {
        throw new Error(`Failed to join channel: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Failed to join channel:", error);
      throw error;
    }
  }

  /**
   * Test the Slack connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("🔗 Testing Slack connection...");
      const result = await this.client.auth.test();

      if (result.ok) {
        console.log(`✅ Connected to Slack workspace: ${result.team}`);
        console.log(`👤 Bot user: ${result.user}`);
        return true;
      } else {
        console.error("❌ Slack connection test failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Slack connection test failed:", error);
      return false;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(): Promise<void> {
    try {
      const result = await this.client.conversations.info({
        channel: this.channelId,
      });

      if (result.ok && result.channel) {
        console.log(`📺 Channel: #${result.channel.name}`);
        console.log(`📊 Members: ${result.channel.num_members}`);
        console.log(`🔒 Private: ${result.channel.is_private ? "Yes" : "No"}`);
      }
    } catch (error) {
      console.error("❌ Failed to get channel info:", error);
    }
  }
}
