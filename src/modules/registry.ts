import { config } from '../config';
import { Database } from '../database';
import { AIService, EmbeddingService, IncidentManager, ObjectStore, UsageTracker, VectorStore } from '../services';
import type { ServiceConstructorType } from '../types';
import { ServiceNotFoundError } from './errors';
import { providers } from './provider';

class ServiceRegistry {
  private services = new Map<string, unknown>();

  register(key: string, Constructor: ServiceConstructorType, ...dependencies: unknown[]) {
    if (this.services.has(key)) {
      console.warn(`[-] service [${key}] is already registered.`);
    }
    this.services.set(key, new Constructor(...dependencies));
  }

  find<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) throw new ServiceNotFoundError(key);
    return service as T;
  }

  list() {
    return Array.from(this.services.keys());
  }
}

const services = new ServiceRegistry();

services.register('incident-manager', IncidentManager);
services.register('usage-tracker', UsageTracker);

services.register('ai:claude-3.5', AIService, providers.anthropic.languageModel('claude-3-5-haiku-latest'));
services.register('ai:claude-4', AIService, providers.anthropic.languageModel('claude-sonnet-4-20250514'));
services.register('ai:gemini-2.5-pro', AIService, providers.google.languageModel('gemini-2.5-pro'));
services.register('ai:gemini-2.5-flash', AIService, providers.google.languageModel('gemini-2.5-flash'));
services.register('ai:gpt-4o-mini', AIService, providers.openai.languageModel('gpt-4o-mini'));
services.register('ai:gpt-5-mini', AIService, providers.openai.languageModel('gpt-5-mini'));

// ? ollama running locally.
services.register('ai:qwen3-mini', AIService, providers.ollama.languageModel('qwen3-8b'));
services.register('ai:qwen3-deepseek', AIService, providers.ollama.languageModel('qwen3-deepseek-r1-0528'));
services.register('ai:deepseek', AIService, providers.ollama.languageModel('deepseek-r1-8b'));
services.register('ai:tiger-gemma', AIService, providers.ollama.languageModel('tiger-gemma-v3'));
services.register('ai:phi4-mini', AIService, providers.ollama.languageModel('phi4-mini'));

services.register('ai:glm', AIService, providers.openrouter.languageModel('z-ai/glm-4.5-air'));
services.register('ai:gpt-oss', AIService, providers.openrouter.languageModel('openai/gpt-oss-120b:free'));
services.register('ai:grok', AIService, providers.openrouter.languageModel('x-ai/grok-4-fast'));
services.register('ai:kimi-k2', AIService, providers.openrouter.languageModel('moonshotai/kimi-k2'));
services.register('ai:qwen3-coder', AIService, providers.openrouter.languageModel('qwen/qwen3-coder'));

// ? does not do 1024 dimensions
services.register('embedding:gemini-001', EmbeddingService, providers.google.textEmbeddingModel('gemini-embedding-001'));
services.register('embedding:nomic', EmbeddingService, providers.ollama.textEmbeddingModel('nomic-embed-text'));

// ? does 1024 dimensions
services.register('embedding:mxbai-large', EmbeddingService, providers.ollama.textEmbeddingModel('mxbai-embed-large'));
services.register('embedding:snowflake', EmbeddingService, providers.ollama.textEmbeddingModel('snowflake-arctic-embed2'));

services.register('database', Database, { ...config.database });
services.register('object-store', ObjectStore, { ...config.s3 });
services.register('vector-store', VectorStore, services.find('database'), services.find('embedding:mxbai-large'));
services.register('vector-store-snowflake', VectorStore, services.find('database'), services.find('embedding:snowflake'));

export { services };
