// Database Configuration for AI Agency Applications
export const config = {
  database: {
    postgresql: {
      url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/ai_agency_db?schema=public"
    },
    neo4j: {
      uri: process.env.NEO4J_URI || "bolt://localhost:7687",
      user: process.env.NEO4J_USER || "neo4j",
      password: process.env.NEO4J_PASSWORD || "password"
    },
    redis: {
      url: process.env.REDIS_URL || "redis://localhost:6379"
    }
  },
  ai: {
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434"
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || ""
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || ""
    }
  },
  search: {
    qdrant: {
      url: "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY || ""
    }
  },
  web: {
    firecrawl: {
      apiKey: process.env.FIRECRAWL_API_KEY || ""
    },
    brave: {
      apiKey: process.env.BRAVE_API_KEY || ""
    },
    tavily: {
      apiKey: process.env.TAVILY_API_KEY || ""
    },
    exa: {
      apiKey: process.env.EXA_API_KEY || ""
    }
  }
};