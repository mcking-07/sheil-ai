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

services.register('ai:haiku-4.5', AIService, providers.anthropic.languageModel('claude-haiku-4-5'));
services.register('ai:opus-4.6', AIService, providers.anthropic.languageModel('claude-opus-4-6'));

services.register('ai:gemini-3-pro', AIService, providers.google.languageModel('gemini-3-pro-preview'));
services.register('ai:flash', AIService, providers.google.languageModel('gemini-flash-latest'));

services.register('ai:codex-5.3', AIService, providers.openai.languageModel('gpt-5.3-codex'));
services.register('ai:gpt-5.1-mini', AIService, providers.openai.languageModel('gpt-5.1-codex-mini'));

// ? ollama running locally.
services.register('ai:qwen3-mini', AIService, providers.ollama.languageModel('qwen3-8b'));
services.register('ai:deepseek', AIService, providers.ollama.languageModel('deepseek-r1-8b'));

services.register('ai:tiger-gemma', AIService, providers.ollama.languageModel('tiger-gemma-v3'));
services.register('ai:phi4-mini', AIService, providers.ollama.languageModel('phi4-mini'));

services.register('ai:minimax', AIService, providers.openrouter.languageModel('minimax/minimax-m2.5'));
services.register('ai:grok', AIService, providers.openrouter.languageModel('x-ai/grok-4.1-fast'));

services.register('ai:kimi-k', AIService, providers.openrouter.languageModel('moonshotai/kimi-k2.5'));
services.register('ai:gpt-oss', AIService, providers.openrouter.languageModel('openai/gpt-oss-120b'));

// ? does not do 1024 dimensions
services.register('embedding:gemini', EmbeddingService, providers.google.embeddingModel('gemini-embedding-001'));
services.register('embedding:nomic', EmbeddingService, providers.ollama.embeddingModel('nomic-embed-text'));

// ? does 1024 dimensions
services.register('embedding:mxbai-large', EmbeddingService, providers.ollama.embeddingModel('mxbai-embed-large'));
services.register('embedding:snowflake', EmbeddingService, providers.ollama.embeddingModel('snowflake-arctic-embed2'));

services.register('database', Database, { ...config.database });
services.register('object-store', ObjectStore, { ...config.s3 });

services.register('vector-store', VectorStore, services.find('database'), services.find('embedding:mxbai-large'));
services.register('vector-store-snowflake', VectorStore, services.find('database'), services.find('embedding:snowflake'));

export { services };
