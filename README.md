# TechBot 🤖

An AI-powered TechBot for Slack that curates the most relevant AI and development news from premium sources, generates insightful summaries, and creates engaging discussion questions to foster technical curiosity and continuous learning within software development teams.

## ✨ Features

- **🔄 Always Different Content**: Intelligent article history tracking ensures you get fresh, unique articles every run
- **🎯 Smart Article Selection**: AI-powered selection from 25+ premium tech and AI news sources
- **📡 Premium RSS Sources**: Curated feeds from OpenAI, Google AI, MIT Technology Review, arXiv, NVIDIA, and more
- **🧠 AI Summarization**: Generates concise, engaging summaries using Google's Gemini 2.0 Flash
- **💬 Discussion Questions**: Creates thought-provoking questions to encourage team collaboration
- **📱 Slack-Ready Output**: Perfectly formatted messages for posting to Slack channels
- **📊 Smart Filtering**: Automatically filters for AI, ML, and development-related content
- **⚡ High Performance**: Concurrent feed processing for faster article retrieval

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Google Gemini AI API Key (Required)
# Get your free API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom RSS feeds (comma-separated)
# RSS_FEEDS=https://example.com/feed1.xml,https://example.com/feed2.xml
```

### 3. Get Your Free Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

### 4. Run TechBot

```bash
# Run normally (gets a different article each time)
npm run start

# Clear article history to reset tracking
npm run start -- --clear-history

# Show help and usage information
npm run start -- --help
```

## 📰 Premium News Sources

TechBot monitors **27 high-quality RSS feeds** from authoritative sources:

### 🔬 **AI Research & Development**

- OpenAI Blog
- Google AI Blog
- Google Research
- Berkeley AI Research (BAIR)
- CMU Machine Learning Blog
- Distill Publications

### 📰 **Tech News with AI Coverage**

- MIT Technology Review (AI Section)
- TechCrunch
- Ars Technica
- The Verge
- VentureBeat (AI Category)

### 👨‍💻 **Developer-Focused Content**

- Machine Learning Mastery
- Towards Data Science
- Analytics Vidhya
- Stack Overflow Blog
- GitHub Blog

### 🎓 **Academic & Research**

- arXiv (AI, ML, NLP sections)
- Various university research blogs

### 🏢 **Industry Leaders**

- NVIDIA AI Blog
- Microsoft Research
- TensorFlow Blog

## 📋 Usage Commands

```bash
# Standard usage - gets fresh content every time
npm run start

# Clear article history (useful for testing or reset)
npm run start -- --clear-history

# Show help and available commands
npm run start -- --help

# Development mode with auto-reload
npm run dev

# Build for production
npm run build
```

## 🔄 How Article Selection Works

1. **📡 Fetch**: Retrieves latest articles from all 27 RSS sources
2. **🤖 Filter**: Automatically filters for AI, ML, and development content
3. **📊 Deduplicate**: Removes duplicate articles across sources
4. **🎯 Smart Selection**: AI analyzes articles and selects the most valuable one
5. **💾 Track History**: Saves selected article to prevent future duplicates
6. **🧠 Process**: Generates summary and discussion question
7. **📱 Format**: Creates Slack-ready message

## 📊 Sample Output

```
🤖 TechBot - AI & Development News

📰 OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities

📝 Summary: OpenAI has unveiled GPT-5, featuring breakthrough reasoning abilities that allow the model to solve complex mathematical problems and engage in multi-step logical thinking. The new model shows significant improvements in code generation, scientific reasoning, and creative problem-solving compared to previous versions.

💬 Discussion Question: How might GPT-5's enhanced reasoning capabilities change the way we approach code review and debugging in our development workflow? What opportunities and challenges do you see for integrating this level of AI reasoning into our current projects?

🔗 Read full article: https://openai.com/blog/gpt-5-announcement

📊 Source: OpenAI | Published: December 15, 2024
```

## 🏗️ Project Structure

```
src/
├── index.ts              # Main entry point with CLI handling
├── techbot.ts            # Core orchestration logic
├── types.ts              # TypeScript interfaces
├── config.ts             # RSS feeds and configuration
├── rss-processor.ts      # RSS feed processing with concurrency
├── ai-processor.ts       # AI content generation and selection
├── message-formatter.ts  # Slack message formatting
└── article-history.ts    # Article history tracking system
```

## ⚙️ Configuration

### Custom RSS Feeds

You can add custom RSS feeds via environment variable:

```env
RSS_FEEDS=https://your-feed1.xml,https://your-feed2.xml
```

### AI Keywords

The bot filters articles using these AI/ML keywords (configurable in `src/config.ts`):

- artificial intelligence, machine learning, deep learning
- neural networks, transformers, LLMs
- computer vision, NLP, generative AI
- And many more...

## 🛠️ Technologies Used

- **TypeScript**: Type-safe development
- **Google Gemini 2.0 Flash**: Advanced AI for summarization and selection
- **RSS Parser**: Efficient feed processing
- **Node.js**: Runtime environment
- **Concurrent Processing**: Fast multi-feed retrieval
- **JSON History Tracking**: Persistent article memory

## 🔧 Troubleshooting

### Common Issues

**No articles found:**

- Check your internet connection
- Verify RSS feeds are accessible
- Some feeds may be temporarily unavailable

**AI processing errors:**

- Ensure `GEMINI_API_KEY` is set correctly
- Check if you've exceeded API rate limits
- Try running again in a few minutes

**All articles already selected:**

- Use `npm run start -- --clear-history` to reset
- Articles are automatically recycled after 24 hours

### Debug Commands

```bash
# Check if history file exists
ls -la .techbot-history.json

# View current configuration
cat src/config.ts

# Clear history manually
rm .techbot-history.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📄 License

ISC

---

**Built with ❤️ for development teams who love staying current with AI and technology trends.**
