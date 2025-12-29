/**
 * Centralized MCP Server Registry
 * Single source of truth for all MCP server configurations
 * 
 * Usage:
 *   node configs/mcp-server-registry.js --format=claude > .mcp.json
 *   node configs/mcp-server-registry.js --format=opencode > opencode-mcp-config.json
 *   node configs/mcp-server-registry.js --format=1password > configs/mcp-servers-1password.json
 */

const MCP_SERVERS = {
  // ============ CORE SERVERS ============
  filesystem: {
    category: 'core',
    package: '@modelcontextprotocol/server-filesystem',
    args: ['${DEVELOPER_DIR:-$HOME/Developer}'],
    env: {
      MCP_FILESYSTEM_ROOT: '${DEVELOPER_DIR:-$HOME/Developer}'
    },
    description: 'File system operations',
    capabilities: ['read', 'write', 'search'],
    status: 'active'
  },

  memory: {
    category: 'core',
    package: '@danielsimonjr/memory-mcp',
    env: {
      MEMORY_DB_PATH: '${DEVELOPER_DIR:-$HOME/Developer}/data/memory.db'
    },
    description: 'Persistent memory storage',
    capabilities: ['store', 'retrieve', 'search'],
    status: 'active'
  },

  'sequential-thinking': {
    category: 'core',
    package: '@modelcontextprotocol/server-sequential-thinking',
    env: {
      SEQUENTIAL_THINKING_DB_PATH: '${DEVELOPER_DIR:-$HOME/Developer}/data/sequential-thinking.db'
    },
    description: 'Sequential reasoning and planning',
    capabilities: ['reasoning', 'planning'],
    status: 'active'
  },

  // ============ AI/ML SERVERS ============
  ollama: {
    category: 'ai',
    command: 'node',
    args: ['mcp-servers/ollama-server.cjs'],
    package: null, // Custom server
    env: {
      OLLAMA_HOST: 'http://localhost:11434'
    },
    envWithModels: {
      OLLAMA_BASE_URL: 'http://localhost:11434',
      OLLAMA_MODELS: 'llama3.2:3b,codellama:7b,mistral:latest'
    },
    description: 'Local LLM inference via Ollama',
    capabilities: ['chat', 'generate', 'embed'],
    status: 'active'
  },


  // ============ SEARCH SERVERS ============
  'brave-search': {
    category: 'search',
    package: 'brave-search',
    env: {
      BRAVE_API_KEY: '${BRAVE_API_KEY}'
    },
    onePasswordRef: 'op://MCP Servers/Brave Search MCP Server/api_key',
    description: 'Privacy-focused web search',
    capabilities: ['web_search', 'images', 'videos'],
    status: 'active'
  },

  tavily: {
    category: 'search',
    package: 'tavily-mcp',
    env: {
      TAVILY_API_KEY: '${TAVILY_API_KEY}'
    },
    onePasswordRef: 'op://MCP Servers/Tavily MCP Server/api_key',
    description: 'Advanced AI-powered search',
    capabilities: ['web_search', 'research'],
    status: 'active'
  },

  exa: {
    category: 'search',
    package: 'exa-mcp-server',
    env: {
      EXA_API_KEY: '${EXA_API_KEY}'
    },
    onePasswordRef: 'op://MCP Servers/Exa MCP Server/api_key',
    description: 'Web crawling and content extraction',
    capabilities: ['web_search', 'crawling', 'extraction'],
    status: 'active'
  },

  firecrawl: {
    category: 'search',
    package: 'firecrawl-mcp',
    env: {
      FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}'
    },
    onePasswordRef: 'op://MCP Servers/Firecrawl MCP Server/api_key',
    description: 'Web scraping and crawling',
    capabilities: ['crawling', 'scraping'],
    status: 'active'
  },

  deepwiki: {
    category: 'search',
    package: 'mcp-deepwiki',
    env: {},
    description: 'Wikipedia and documentation search',
    capabilities: ['wiki_search', 'documentation'],
    status: 'active'
  },

  // ============ DATABASE SERVERS ============
  postgres: {
    category: 'database',
    package: '@modelcontextprotocol/server-postgres',
    env: {
      DATABASE_URL: '${DATABASE_URL}'
    },
    onePasswordRef: 'op://MCP Servers/PostgreSQL MCP Server/connection_string',
    description: 'PostgreSQL database operations',
    capabilities: ['query', 'schema', 'crud'],
    status: 'active'
  },

  redis: {
    category: 'database',
    package: 'redis-mcp',
    env: {
      REDIS_URL: 'redis://localhost:6379'
    },
    onePasswordRef: 'op://MCP Servers/Redis MCP Server/url',
    description: 'Redis cache and data store',
    capabilities: ['cache', 'pub_sub', 'data_store'],
    status: 'active'
  },

  neo4j: {
    category: 'database',
    package: '@henrychong-ai/mcp-neo4j-knowledge-graph',
    env: {
      NEO4J_URI: 'bolt://localhost:7687',
      NEO4J_USER: 'neo4j',
      NEO4J_PASSWORD: '${NEO4J_PASSWORD}'
    },
    onePasswordEnv: {
      NEO4J_CONNECTION_URL: 'op://MCP Servers/Neo4j MCP Server/url',
      NEO4J_PASSWORD: 'op://MCP Servers/Neo4j MCP Server/password'
    },
    description: 'Graph database operations',
    capabilities: ['graph', 'cypher', 'knowledge_graph'],
    status: 'active'
  },

  qdrant: {
    category: 'database',
    package: 'qdrant-api-mcp',
    env: {
      QDRANT_URL: 'http://localhost:6333'
    },
    onePasswordEnv: {
      QDRANT_API_KEY: 'op://MCP Servers/Qdrant MCP Server/api_key',
      QDRANT_CLUSTER_URL: 'op://MCP Servers/Qdrant MCP Server/url'
    },
    description: 'Vector database for embeddings',
    capabilities: ['vector_search', 'embeddings'],
    status: 'active'
  },

  mongodb: {
    category: 'database',
    package: 'mongodb-mcp',
    env: {
      MONGODB_URI: '${MONGODB_URI}'
    },
    onePasswordRef: 'op://MCP Servers/MongoDB MCP Server/uri',
    description: 'MongoDB document database',
    capabilities: ['documents', 'query', 'aggregation'],
    status: 'active'
  },

  sqlite: {
    category: 'database',
    package: 'mcp-server-sqlite',
    args: ['--db-path', '${DEVELOPER_DIR:-$HOME/Developer}/data/app.db'],
    env: {},
    description: 'SQLite database operations',
    capabilities: ['query', 'schema', 'crud'],
    status: 'active'
  },

  // ============ DEVOPS SERVERS ============
  github: {
    category: 'devops',
    package: '@ama-mcp/github',
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}'
    },
    onePasswordEnv: {
      GITHUB_PERSONAL_ACCESS_TOKEN: 'op://MCP Servers/GitHub MCP Server/token'
    },
    description: 'GitHub API integration',
    capabilities: ['repos', 'issues', 'prs', 'actions'],
    status: 'active'
  },

  gitlab: {
    category: 'devops',
    package: 'gitlab-mcp',
    env: {
      GITLAB_TOKEN: '${GITLAB_TOKEN}'
    },
    onePasswordRef: 'op://MCP Servers/GitLab MCP Server/token',
    description: 'GitLab API integration',
    capabilities: ['repos', 'issues', 'pipelines'],
    status: 'active'
  },


  docker: {
    category: 'devops',
    package: 'docker-mcp',
    env: {
      DOCKER_HOST: 'unix:///var/run/docker.sock'
    },
    description: 'Docker container management',
    capabilities: ['containers', 'images', 'compose'],
    status: 'active'
  },

  kubernetes: {
    category: 'devops',
    package: 'kubernetes-mcp',
    env: {
      KUBECONFIG: '${HOME}/.kube/config'
    },
    description: 'Kubernetes cluster management',
    capabilities: ['pods', 'deployments', 'services'],
    status: 'active'
  },

  terraform: {
    category: 'devops',
    package: 'terraform-mcp',
    env: {
      AWS_PROFILE: 'default',
      AWS_REGION: 'us-east-1'
    },
    onePasswordEnv: {
      TF_VAR_aws_access_key: 'op://MCP Servers/AWS MCP Server/access_key',
      TF_VAR_aws_secret_key: 'op://MCP Servers/AWS MCP Server/secret_key'
    },
    description: 'Infrastructure as Code',
    capabilities: ['plan', 'apply', 'state'],
    status: 'active'
  },

  // ============ CLOUD SERVERS ============
  aws: {
    category: 'cloud',
    package: 'aws-mcp',
    env: {
      AWS_PROFILE: 'default',
      AWS_REGION: 'us-east-1'
    },
    onePasswordEnv: {
      AWS_ACCESS_KEY_ID: 'op://MCP Servers/AWS MCP Server/access_key',
      AWS_SECRET_ACCESS_KEY: 'op://MCP Servers/AWS MCP Server/secret_key',
      AWS_REGION: 'us-east-1'
    },
    description: 'AWS cloud services',
    capabilities: ['s3', 'ec2', 'lambda', 'rds'],
    status: 'active'
  },

  vercel: {
    category: 'cloud',
    package: 'mcp-server-vercel',
    env: {
      VERCEL_TOKEN: '${VERCEL_TOKEN}'
    },
    onePasswordRef: 'op://MCP Servers/Vercel MCP Server/token',
    description: 'Vercel deployment platform',
    capabilities: ['deploy', 'projects', 'domains'],
    status: 'active'
  },

  supabase: {
    category: 'cloud',
    package: 'mcp-server-supabase',
    env: {
      SUPABASE_URL: '${SUPABASE_URL}',
      SUPABASE_KEY: '${SUPABASE_KEY}'
    },
    onePasswordEnv: {
      SUPABASE_URL: 'op://MCP Servers/Supabase MCP Server/url',
      SUPABASE_KEY: 'op://MCP Servers/Supabase MCP Server/api_key'
    },
    description: 'Supabase backend services',
    capabilities: ['database', 'auth', 'storage'],
    status: 'active'
  },

  // ============ COMMUNICATION SERVERS ============
  slack: {
    category: 'communication',
    package: 'slack-mcp',
    env: {
      SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}'
    },
    onePasswordEnv: {
      SLACK_BOT_TOKEN: 'op://MCP Servers/Slack MCP Server/bot_token',
      SLACK_APP_TOKEN: 'op://MCP Servers/Slack MCP Server/app_token'
    },
    description: 'Slack messaging integration',
    capabilities: ['messages', 'channels', 'files'],
    status: 'active'
  },

  discord: {
    category: 'communication',
    package: 'discord-mcp',
    env: {
      DISCORD_BOT_TOKEN: '${DISCORD_BOT_TOKEN}'
    },
    onePasswordRef: 'op://MCP Servers/Discord MCP Server/bot_token',
    description: 'Discord bot integration',
    capabilities: ['messages', 'channels', 'commands'],
    status: 'active'
  },

  email: {
    category: 'communication',
    package: 'email-mcp',
    env: {},
    onePasswordEnv: {
      EMAIL_SMTP_HOST: 'op://MCP Servers/Email MCP Server/smtp_host',
      EMAIL_SMTP_PORT: 'op://MCP Servers/Email MCP Server/smtp_port',
      EMAIL_USERNAME: 'op://MCP Servers/Email MCP Server/username',
      EMAIL_PASSWORD: 'op://MCP Servers/Email MCP Server/password'
    },
    description: 'Email sending and receiving',
    capabilities: ['send', 'receive', 'imap'],
    status: 'active'
  },

  // ============ PRODUCTIVITY SERVERS ============
  notion: {
    category: 'productivity',
    package: 'mcp-server-notion',
    env: {
      NOTION_TOKEN: '${NOTION_TOKEN}'
    },
    onePasswordRef: 'op://MCP Servers/Notion MCP Server/token',
    description: 'Notion workspace integration',
    capabilities: ['pages', 'databases', 'blocks'],
    status: 'active'
  },

  linear: {
    category: 'productivity',
    package: 'mcp-server-linear',
    env: {
      LINEAR_API_KEY: '${LINEAR_API_KEY}'
    },
    onePasswordRef: 'op://MCP Servers/Linear MCP Server/api_key',
    description: 'Linear issue tracking',
    capabilities: ['issues', 'projects', 'cycles'],
    status: 'active'
  },

  'task-master': {
    category: 'productivity',
    package: '@gofman3/task-master-mcp',
    env: {
      TASK_DB_PATH: '${HOME}/.claude/tasks.db'
    },
    description: 'Task and project management',
    capabilities: ['tasks', 'projects', 'tracking'],
    status: 'active'
  },

  // ============ AUTH SERVERS ============
  clerk: {
    category: 'auth',
    package: 'mcp-server-clerk',
    env: {
      CLERK_SECRET_KEY: '${CLERK_SECRET_KEY}'
    },
    onePasswordRef: 'op://MCP Servers/Clerk MCP Server/secret_key',
    description: 'Clerk authentication',
    capabilities: ['auth', 'users', 'sessions'],
    status: 'active'
  },

  // ============ AUTOMATION SERVERS ============
  n8n: {
    category: 'automation',
    package: 'n8n-nodes-mcp',
    env: {
      N8N_HOST: 'http://localhost:5678',
      N8N_API_KEY: '${N8N_API_KEY}'
    },
    onePasswordEnv: {
      N8N_WEBHOOK_URL: 'op://MCP Servers/N8N MCP Server/webhook_url',
      N8N_API_KEY: 'op://MCP Servers/N8N MCP Server/api_key'
    },
    description: 'Workflow automation',
    capabilities: ['workflows', 'webhooks', 'triggers'],
    status: 'active'
  },

  // ============ BROWSER SERVERS ============
  playwright: {
    category: 'browser',
    package: '@playwright/mcp',
    env: {
      HEADLESS: 'true'
    },
    description: 'Browser automation',
    capabilities: ['browse', 'scrape', 'test'],
    status: 'active'
  },

  // ============ MEMORY & AI SERVERS ============
  mem0: {
    category: 'ai',
    command: 'uvx',
    args: ['mem0-mcp-server'],
    package: 'mem0-mcp-server', // Official Mem0 MCP server
    env: {
      MEM0_API_KEY: '${MEM0_API_KEY}',
      MEM0_DEFAULT_USER_ID: '${MEM0_DEFAULT_USER_ID}'
    },
    onePasswordEnv: {
      MEM0_API_KEY: 'op://MCP Servers/Mem0.ai MCP Server/api_key'
    },
    description: 'Official Mem0.ai MCP server for memory management',
    capabilities: ['add_memory', 'search_memories', 'get_memories', 'get_memory', 'update_memory', 'delete_memory', 'delete_all_memories', 'delete_entities', 'list_entities'],
    status: 'active'
  }
};

// ============ CONFIG GENERATORS ============

function generateClaudeConfig(servers = MCP_SERVERS) {


  const config = { mcpServers: {} };

  for (const [name, server] of Object.entries(servers)) {
    if (server.status !== 'active') continue;


    
    const serverConfig = {
      command: server.command || 'npx',
      args: server.package
        ? ['-y', server.package, ...(server.args || [])]
        : server.args || [],
      env: server.env || {}
    };


    // Add NODE_ENV for npx commands
    if (serverConfig.command === 'npx') {
      serverConfig.env.NODE_ENV = serverConfig.env.NODE_ENV || 'production';
    }

    config.mcpServers[name] = serverConfig;
  }
  
  return config;
}

function generate1PasswordConfig(servers = MCP_SERVERS) {
  const config = {
    '$schema': 'https://modelcontextprotocol.io/schema/mcp-config.json',
    version: '2.0.0',
    description: 'MCP Server Configuration with 1Password Secret Injection',
    mcpServers: {}
  };
  
  for (const [name, server] of Object.entries(servers)) {
    if (server.status !== 'active') continue;
    
    const serverConfig = {
      command: server.command || 'npx',
      args: server.package
        ? ['-y', server.package, ...(server.args || [])]
        : server.args || []
    };
    
    // Use 1Password env if available, otherwise fall back to regular env
    if (server.onePasswordEnv) {
      serverConfig.env = server.onePasswordEnv;
    } else if (server.onePasswordRef) {
      // Single secret reference - find the env var key
      const envKey = Object.keys(server.env).find(k => 
        server.env[k].startsWith('${') || k.includes('KEY') || k.includes('TOKEN') || k.includes('PASSWORD')
      );
      if (envKey) {
        serverConfig.env = { ...server.env, [envKey]: server.onePasswordRef };
      } else {
        serverConfig.env = server.env || {};
      }
    } else {
      serverConfig.env = server.env || {};
    }
    
    config.mcpServers[name] = serverConfig;
  }
  
  return config;
}

function generateOpenCodeConfig(servers = MCP_SERVERS) {
  const config = {
    version: '1.0.0',
    description: 'OpenCode MCP Server Integration Configuration',
    mcpServers: {},
    integrationGuidelines: {
      agents: {
        explore: 'Use for research and information gathering',
        build: 'Use for code generation and development',
        compaction: 'Use for code analysis and optimization'
      }
    }
  };
  
  const agentMapping = {
    search: 'explore',
    ai: 'build',
    database: 'build',
    devops: 'build',
    core: 'build'
  };
  
  for (const [name, server] of Object.entries(servers)) {
    if (server.status !== 'active') continue;
    
    config.mcpServers[name] = {
      description: server.description,
      command: server.package ? `npx -y ${server.package}` : `${server.command} ${(server.args || []).join(' ')}`,
      capabilities: server.capabilities || [],
      environment: Object.keys(server.env || {}).filter(k => k.includes('KEY') || k.includes('TOKEN')),
      opencodeIntegration: {
        agent: agentMapping[server.category] || 'build',
        usage: server.description
      }
    };
  }
  
  return config;
}

function generateEnvTemplate(servers = MCP_SERVERS) {
  const envVars = new Set();
  
  for (const server of Object.values(servers)) {
    if (server.status !== 'active') continue;
    
    for (const [key, value] of Object.entries(server.env || {})) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1).split(':-')[0];
        envVars.add(varName);
      }
    }
  }
  
  let template = '# MCP Server Environment Variables\n';
  template += '# Generated from configs/mcp-server-registry.js\n\n';
  
  const categories = {
    API_KEYS: [],
    TOKENS: [],
    PASSWORDS: [],
    URLS: [],
    PATHS: [],
    OTHER: []
  };
  
  for (const varName of [...envVars].sort()) {
    if (varName.includes('KEY')) categories.API_KEYS.push(varName);
    else if (varName.includes('TOKEN')) categories.TOKENS.push(varName);
    else if (varName.includes('PASSWORD')) categories.PASSWORDS.push(varName);
    else if (varName.includes('URL') || varName.includes('URI')) categories.URLS.push(varName);
    else if (varName.includes('PATH') || varName.includes('DIR')) categories.PATHS.push(varName);
    else categories.OTHER.push(varName);
  }
  
  for (const [category, vars] of Object.entries(categories)) {
    if (vars.length === 0) continue;
    template += `# ${category.replace('_', ' ')}\n`;
    for (const v of vars) {
      template += `${v}=\n`;
    }
    template += '\n';
  }
  
  return template;
}

function generateHealthCheckScript(servers = MCP_SERVERS) {
  let script = `#!/bin/bash
# MCP Server Health Check Script
# Generated from configs/mcp-server-registry.js

set -e

GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo "MCP Server Health Check"
echo "======================="
echo ""

HEALTHY=0
UNHEALTHY=0
SKIPPED=0

`;

  for (const [name, server] of Object.entries(servers)) {
    if (server.status !== 'active') continue;
    
    const envVars = Object.entries(server.env || {})
      .filter(([_, v]) => typeof v === 'string' && v.startsWith('${'))
      .map(([k, v]) => v.slice(2, -1).split(':-')[0]);
    
    script += `# Check ${name}\n`;
    
    if (envVars.length > 0) {
      script += `if [ -n "\${${envVars[0]}:-}" ]; then\n`;
      script += `  echo -e "\${GREEN}[OK]\${NC} ${name} - configured"\n`;
      script += `  ((HEALTHY++))\n`;
      script += `else\n`;
      script += `  echo -e "\${YELLOW}[SKIP]\${NC} ${name} - missing ${envVars[0]}"\n`;
      script += `  ((SKIPPED++))\n`;
      script += `fi\n\n`;
    } else {
      script += `echo -e "\${GREEN}[OK]\${NC} ${name} - no secrets required"\n`;
      script += `((HEALTHY++))\n\n`;
    }
  }

  script += `
echo ""
echo "Summary"
echo "-------"
echo -e "Healthy: \${GREEN}\${HEALTHY}\${NC}"
echo -e "Skipped: \${YELLOW}\${SKIPPED}\${NC}"
echo -e "Unhealthy: \${RED}\${UNHEALTHY}\${NC}"
`;

  return script;
}

// ============ CLI ============

function main() {
  const args = process.argv.slice(2);
  const formatArg = args.find(a => a.startsWith('--format='));
  const format = formatArg ? formatArg.split('=')[1] : 'claude';
  
  let output;
  
  switch (format) {
    case 'claude':
      output = JSON.stringify(generateClaudeConfig(), null, 2);
      break;
    case '1password':
      output = JSON.stringify(generate1PasswordConfig(), null, 2);
      break;
    case 'opencode':
      output = JSON.stringify(generateOpenCodeConfig(), null, 2);
      break;
    case 'env':
      output = generateEnvTemplate();
      break;
    case 'healthcheck':
      output = generateHealthCheckScript();
      break;
    case 'list': {
      const categories = {};
      for (const [name, server] of Object.entries(MCP_SERVERS)) {
        const cat = server.category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(`${name}: ${server.description} [${server.status}]`);
      }
      output = Object.entries(categories)
        .map(([cat, servers]) => `\n${cat.toUpperCase()}\n${'='.repeat(cat.length)}\n${servers.join('\n')}`)
        .join('\n');
      break;
    }
    default:
      console.error(`Unknown format: ${format}`);
      console.error('Available formats: claude, 1password, opencode, env, healthcheck, list');
      process.exit(1);
  }
  
  console.log(output);
}

// Export for programmatic use
module.exports = {
  MCP_SERVERS,
  generateClaudeConfig,
  generate1PasswordConfig,
  generateOpenCodeConfig,
  generateEnvTemplate,
  generateHealthCheckScript
};

// Run if called directly
if (require.main === module) {
  main();
}
