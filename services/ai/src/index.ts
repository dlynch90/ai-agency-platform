import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import pino from 'pino';
import { AIRequestSchema, type AIRequest, type AIResponse } from '@ai-agency/types';
import { config, USE_CASE_CONFIG, HYPERPARAMETER_DEFAULTS } from '@ai-agency/config';

const log = pino({ level: config.env.LOG_LEVEL });

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.get('/health', (c) => c.json({ status: 'ok', service: 'ai' }));

app.post('/v1/completion', zValidator('json', AIRequestSchema), async (c) => {
  const startTime = Date.now();
  const request = c.req.valid('json');
  
  log.info({ request }, 'AI completion request received');
  
  const useCaseConfig = USE_CASE_CONFIG[request.useCase];
  const model = request.model || useCaseConfig.defaultModel;
  
  const response = await callLiteLLM({
    model,
    prompt: request.prompt,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    topP: request.topP,
  });
  
  const latencyMs = Date.now() - startTime;
  
  const result: AIResponse = {
    content: response.content,
    model: response.model,
    provider: request.provider,
    usage: response.usage,
    latencyMs,
    costUsd: response.costUsd,
  };
  
  log.info({ latencyMs, model, tenantId: request.tenantId }, 'AI completion completed');
  
  return c.json(result);
});

app.post('/v1/evaluate', zValidator('json', AIRequestSchema), async (c) => {
  const request = c.req.valid('json');
  
  const models = ['gpt-4', 'claude-3-sonnet-20240229', 'gemini-pro'];
  const results = await Promise.all(
    models.map(async (model: string) => {
      const startTime = Date.now();
      const response = await callLiteLLM({
        model,
        prompt: request.prompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        topP: request.topP,
      });
      
      return {
        model,
        content: response.content,
        latencyMs: Date.now() - startTime,
        usage: response.usage,
      };
    })
  );
  
  return c.json({ evaluations: results });
});

app.get('/v1/models', (c) => {
  return c.json({
    models: HYPERPARAMETER_DEFAULTS.model,
    useCases: Object.keys(USE_CASE_CONFIG),
    hyperparameters: HYPERPARAMETER_DEFAULTS,
  });
});

interface LiteLLMRequest {
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface LiteLLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd?: number;
}

async function callLiteLLM(request: LiteLLMRequest): Promise<LiteLLMResponse> {
  const baseUrl = config.env.LITELLM_BASE_URL;
  
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    }),
  });
  
  if (!response.ok) {
    const ollamaUrl = config.env.OLLAMA_BASE_URL;
    log.warn({ model: request.model }, 'LiteLLM failed, falling back to Ollama');
    
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model.replace('ollama/', ''),
        prompt: request.prompt,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
          top_p: request.topP,
        },
      }),
    });
    
    const ollamaData = await ollamaResponse.json();
    
    return {
      content: ollamaData.response,
      model: request.model,
      usage: {
        promptTokens: ollamaData.prompt_eval_count || 0,
        completionTokens: ollamaData.eval_count || 0,
        totalTokens: (ollamaData.prompt_eval_count || 0) + (ollamaData.eval_count || 0),
      },
    };
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
    costUsd: data.usage.cost,
  };
}

const port = parseInt(process.env.PORT || '3001', 10);

export default {
  port,
  fetch: app.fetch,
};
