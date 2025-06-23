# TechBot 🤖

An AI-powered TechBot for Slack that summarizes tech articles and generates discussion questions to foster technical curiosity and continuous learning within software development teams.

## Features

- **Article Ingestion**: Reads recent articles from popular tech RSS feeds
- **AI Summarization**: Generates concise summaries using Google's Gemini AI
- **Discussion Questions**: Creates thought-provoking questions to encourage team collaboration
- **Slack-Ready Output**: Formats messages for easy posting to Slack channels

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini AI API Key
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## Usage

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## RSS Feeds

The bot currently monitors these tech RSS feeds:

- TechCrunch
- CNN Technology
- Ars Technica
- Wired
- VentureBeat

## Output Format

The bot generates messages in this format:

```
🤖 TechBot - Daily News
📰 [Article Title]
Summary: [AI-generated summary]
🔗 [Read article](link)
💬 Question for the team:
[AI-generated discussion question]
```

## Project Structure

```
src/
├── index.ts              # Main entry point
├── techbot.ts            # Core bot logic
├── types.ts              # TypeScript interfaces
├── rss-processor.ts      # RSS feed processing
├── ai-processor.ts       # AI content generation
└── message-formatter.ts  # Message formatting
```

## Technologies Used

- **TypeScript**: Type-safe development
- **Google Gemini AI**: Article summarization and question generation
- **RSS Parser**: Feed processing
- **JSDOM**: HTML content extraction
- **Node.js**: Runtime environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
