// Configuration for RSS feeds and news sources
export interface NewsConfig {
  rssFeeds: string[];
  aiKeywords: string[];
  maxArticlesPerFeed: number;
  maxTotalArticles: number;
}

// Default configuration
export const defaultConfig: NewsConfig = {
  rssFeeds: [
    // AI Research and Development - Primary Sources
    "https://openai.com/blog/rss/",
    "https://ai.googleblog.com/atom.xml",
    "https://research.google/blog/rss",
    "https://bair.berkeley.edu/blog/feed.xml",
    "https://blog.ml.cmu.edu/feed",

    // Tech News with Strong AI Coverage
    "https://techcrunch.com/feed/",
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
    "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
    "https://venturebeat.com/category/ai/feed/",

    // Developer-Focused AI Content
    "https://machinelearningmastery.com/blog/feed/",
    "https://towardsdatascience.com/feed",
    "https://www.analyticsvidhya.com/blog/feed/",
    "https://distill.pub/rss.xml",

    // Academic and Research
    "https://arxiv.org/rss/cs.AI",
    "https://arxiv.org/rss/cs.LG",
    "https://arxiv.org/rss/cs.CL",

    // Industry Leaders
    "https://blogs.nvidia.com/blog/category/ai/feed/",
    "https://www.microsoft.com/en-us/research/feed/",
    "https://blog.tensorflow.org/feeds/posts/default?alt=rss",

    // AI News Aggregators
    "https://www.marktechpost.com/feed",
    "https://www.unite.ai/feed/",
    "https://analyticsindiamag.com/feed/",
    "https://www.artificialintelligence-news.com/feed/rss/",

    // Development and Programming
    "https://stackoverflow.blog/feed/",
    "https://github.blog/feed/",
    "https://www.zdnet.com/topic/artificial-intelligence/rss.xml",
  ],
  aiKeywords: [
    // Core AI/ML terms
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "deep learning",
    "neural network",
    "llm",
    "large language model",
    "gpt",
    "chatgpt",
    "openai",
    "claude",
    "anthropic",
    "gemini",
    "google ai",
    "microsoft ai",
    "azure ai",
    "aws ai",
    "tensorflow",
    "pytorch",
    "automation",
    "robotics",
    "computer vision",
    "nlp",
    "natural language processing",
    "data science",
    "algorithm",

    // Developer-focused AI terms
    "ai api",
    "ml api",
    "ai framework",
    "ml framework",
    "ai library",
    "ml library",
    "ai model",
    "ml model",
    "ai deployment",
    "ml deployment",
    "ai inference",
    "ml inference",
    "ai training",
    "ml training",
    "ai pipeline",
    "ml pipeline",
    "ai infrastructure",
    "ml infrastructure",
    "ai platform",
    "ml platform",
    "ai service",
    "ml service",
    "ai tool",
    "ml tool",
    "ai sdk",
    "ml sdk",
    "ai integration",
    "ml integration",
    "ai development",
    "ml development",
    "ai engineering",
    "ml engineering",
    "ai developer",
    "ml developer",
    "ai code",
    "ml code",
    "ai programming",
    "ml programming",
    "ai software",
    "ml software",
    "ai application",
    "ml application",
    "ai system",
    "ml system",
    "ai architecture",
    "ml architecture",
    "ai design",
    "ml design",
    "ai testing",
    "ml testing",
    "ai debugging",
    "ml debugging",
    "ai monitoring",
    "ml monitoring",
    "ai performance",
    "ml performance",
    "ai optimization",
    "ml optimization",
    "ai scaling",
    "ml scaling",
    "ai security",
    "ml security",
    "ai privacy",
    "ml privacy",
    "ai ethics",
    "ml ethics",
    "ai bias",
    "ml bias",
    "ai fairness",
    "ml fairness",

    // Specific AI technologies and tools
    "hugging face",
    "transformers",
    "bert",
    "gpt-4",
    "gpt-3",
    "dall-e",
    "stable diffusion",
    "midjourney",
    "langchain",
    "llama",
    "falcon",
    "anthropic claude",
    "google bard",
    "microsoft copilot",
    "github copilot",
    "amazon bedrock",
    "vertex ai",
    "azure openai",
    "aws sagemaker",
    "kubeflow",
    "mlflow",
    "wandb",
    "weights & biases",
    "tensorboard",
    "jupyter",
    "colab",
    "kaggle",
    "fastai",
    "scikit-learn",
    "pandas",
    "numpy",
    "matplotlib",
    "seaborn",
    "plotly",
    "streamlit",
    "gradio",
    "ray",
    "dask",
    "spark",
    "airflow",
    "prefect",
    "dagster",
    "docker",
    "kubernetes",
    "terraform",
    "ansible",
    "jenkins",
    "gitlab ci",
    "github actions",
    "circleci",
    "travis ci",
    "aws codebuild",

    // AI research and academic terms
    "arxiv",
    "research paper",
    "academic paper",
    "conference paper",
    "icml",
    "neurips",
    "iclr",
    "aaai",
    "ijcai",
    "acl",
    "emnlp",
    "computer vision",
    "cvpr",
    "iccv",
    "eccv",
    "robotics",
    "icra",
    "iros",
    "reinforcement learning",
    "rl",
    "supervised learning",
    "unsupervised learning",
    "semi-supervised learning",
    "transfer learning",
    "few-shot learning",
    "zero-shot learning",
    "meta-learning",
    "federated learning",
    "distributed learning",
    "edge ai",
    "edge ml",
    "federated learning",
    "privacy-preserving ml",
    "differential privacy",
    "adversarial attacks",
    "robustness",
    "interpretability",
    "explainability",
    "model interpretability",
    "model explainability",
    "xai",
    "explainable ai",
  ],
  maxArticlesPerFeed: 5,
  maxTotalArticles: 10,
};

// Function to load configuration from environment variables
export const loadConfigFromEnv = (): NewsConfig => {
  const config = { ...defaultConfig };

  // Load RSS feeds from environment variable
  const rssFeedsEnv = process.env.RSS_FEEDS;
  if (rssFeedsEnv) {
    config.rssFeeds = rssFeedsEnv
      .split(",")
      .map((feed) => feed.trim())
      .filter((feed) => feed.length > 0);
  }

  // Load AI keywords from environment variable
  const aiKeywordsEnv = process.env.AI_KEYWORDS;
  if (aiKeywordsEnv) {
    config.aiKeywords = aiKeywordsEnv
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
  }

  // Load numeric configs
  const maxArticlesPerFeed = process.env.MAX_ARTICLES_PER_FEED;
  if (maxArticlesPerFeed) {
    config.maxArticlesPerFeed = parseInt(maxArticlesPerFeed, 10);
  }

  const maxTotalArticles = process.env.MAX_TOTAL_ARTICLES;
  if (maxTotalArticles) {
    config.maxTotalArticles = parseInt(maxTotalArticles, 10);
  }

  return config;
};

// Function to get current configuration
export const getConfig = (): NewsConfig => {
  return loadConfigFromEnv();
};
