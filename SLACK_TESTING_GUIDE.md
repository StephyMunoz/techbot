# 🧪 TechBot Slack Testing Guide

This guide will help you test the TechBot in Slack with both manual and automated posting methods.

## 🚀 Quick Start Testing

### Method 1: Manual Copy-Paste (Easiest)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   # Create .env file
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   ```

3. **Run the bot:**

   ```bash
   npm run build
   npm run start
   ```

4. **Copy and paste:** The bot outputs a perfectly formatted message. Copy it and paste into your Slack channel.

### Method 2: Automated Slack Posting (Recommended)

## 🔧 Setting Up Slack Integration

### Step 1: Create a Slack App

1. Go to [Slack API Apps page](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app: `TechBot`
4. Select your workspace

### Step 2: Configure Bot Permissions

1. In your app settings, go to "OAuth & Permissions"
2. Under "Scopes" → "Bot Token Scopes", add:
   - `chat:write` - Post messages to channels
   - `channels:read` - Read channel information
   - `auth:test` - Test authentication

### Step 3: Install App to Workspace

1. Go to "Install App" in the sidebar
2. Click "Install to Workspace"
3. Authorize the app
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### Step 4: Get Channel ID

1. In Slack, right-click on your target channel
2. Select "Copy link"
3. The channel ID is the last part of the URL (e.g., `C1234567890`)

### Step 5: Update Environment Variables

```bash
# Add to your .env file
GEMINI_API_KEY=your_gemini_api_key_here
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=C1234567890
```

### Step 6: Test the Integration

```bash
# Install the new dependency
npm install

# Build and run
npm run build
npm run start
```

## 🧪 Testing Scenarios

### Test 1: Basic Functionality

```bash
# Clear history to start fresh
npm run start -- --clear-history
```

**Expected:** Bot fetches articles, selects one, generates summary, and posts to Slack.

### Test 2: History Tracking

```bash
# Run twice in a row
npm run start
npm run start
```

**Expected:** Second run selects a different article (not the same as first).

### Test 3: Error Handling

```bash
# Test with invalid API key
GEMINI_API_KEY=invalid_key npm run start
```

**Expected:** Graceful error handling with helpful troubleshooting tips.

### Test 4: Slack Connection Issues

```bash
# Test with invalid Slack token
SLACK_BOT_TOKEN=invalid_token npm run start
```

**Expected:** Falls back to console output with warning message.

## 📱 Expected Slack Message Format

When working correctly, you should see a message like this in Slack:

```
🤖 TechBot - AI & Development News

📰 OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities

📝 Summary: OpenAI has unveiled GPT-5, featuring breakthrough reasoning abilities that allow the model to solve complex mathematical problems and engage in multi-step logical thinking...

💬 Discussion Question: How might GPT-5's enhanced reasoning capabilities change the way we approach code review and debugging in our development workflow?

🔗 Read full article: https://openai.com/blog/gpt-5-announcement
```

## 🔍 Troubleshooting

### Common Issues

**"No articles found"**

- Check internet connection
- Verify RSS feeds are accessible
- Some feeds may be temporarily down

**"Slack connection failed"**

- Verify `SLACK_BOT_TOKEN` is correct
- Ensure bot has proper permissions
- Check if channel ID is correct

**"AI processing error"**

- Verify `GEMINI_API_KEY` is valid
- Check API rate limits
- Try again in a few minutes

**"All articles already selected"**

```bash
# Clear history to reset
npm run start -- --clear-history
```

### Debug Commands

```bash
# Check environment variables
echo $GEMINI_API_KEY
echo $SLACK_BOT_TOKEN
echo $SLACK_CHANNEL_ID

# Test Slack connection only
node -e "
import { SlackClient } from './dist/slack-client.js';
const client = new SlackClient(process.env.SLACK_BOT_TOKEN, process.env.SLACK_CHANNEL_ID);
client.testConnection();
"

# View history file
cat .techbot-history.json
```

## 🎯 Advanced Testing

### Test with Custom RSS Feeds

```bash
# Add custom feeds to .env
RSS_FEEDS=https://your-blog.com/feed.xml,https://another-blog.com/rss
npm run start
```

### Test with Different Channel

```bash
# Change channel for testing
SLACK_CHANNEL_ID=C9876543210 npm run start
```

### Monitor Performance

```bash
# Time the execution
time npm run start
```

## 📊 Success Metrics

✅ **Successful test indicators:**

- Bot runs without errors
- Different articles selected on subsequent runs
- Messages posted to Slack with proper formatting
- History tracking works (no duplicates)
- AI summaries are coherent and relevant
- Discussion questions are thought-provoking

❌ **Failure indicators:**

- Repeated articles (history not working)
- Empty or malformed Slack messages
- API errors or timeouts
- No articles found from any source

## 🚀 Production Deployment

Once testing is complete:

1. **Set up automated scheduling:**

   ```bash
   # Add to crontab for daily runs
   0 9 * * * cd /path/to/techbot && npm run start
   ```

2. **Monitor logs:**

   ```bash
   # Run with logging
   npm run start >> techbot.log 2>&1
   ```

3. **Set up alerts for failures:**
   - Monitor exit codes
   - Check for error patterns
   - Set up Slack notifications for bot failures

## 🎉 Congratulations!

You've successfully tested TechBot in Slack! The bot will now automatically:

- Fetch fresh AI/tech articles daily
- Generate insightful summaries
- Create engaging discussion questions
- Post beautifully formatted messages to your Slack channel
- Avoid duplicate articles through smart history tracking

Your team will now receive curated, high-quality tech content that fosters learning and discussion! 🚀
