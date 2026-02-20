import type { S3ClientConfig } from '@aws-sdk/client-s3';
import type { Output, TextStreamPart, Tool, UIMessage } from 'ai';
import type { providers } from '../modules';

type ProviderType = keyof typeof providers;

interface ProviderOptionsType {
  dimensions?: number;
  disableParallelToolUse?: boolean;
  embedding?: boolean;
  reasoning?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
  thinkingBudget?: number;
}

interface ModelGenerationOptionsType {
  frequencyPenalty?: number;
  maxTokens?: number;
  presencePenalty?: number;
  seed?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
}

type AIMessage = Omit<UIMessage, 'id'>;

interface AIGenerateParams {
  messages: AIMessage[];
  options?: ProviderOptionsType;
  params?: ModelGenerationOptionsType;
  system?: string;
  tools?: Record<string, Tool>;
}

interface AIObjectGenerateParams extends AIGenerateParams {
  output?: ReturnType<typeof Output.text> | ReturnType<typeof Output.object> | ReturnType<typeof Output.array> | ReturnType<typeof Output.choice> | ReturnType<typeof Output.json>;
};

type AIResponseStreamPartType = TextStreamPart<Record<string, Tool>>;

interface EmbeddingGenerateParams {
  content: string[];
  options?: ProviderOptionsType;
}

type BaseMetadataType = { source: 'website'; url: string } | { source: 'ticket'; content_id: string } | { source: 'other'; description: string };

type MetadataType = BaseMetadataType & { language: string; tags?: string[] };

interface IngestableType {
  content: string;
  metadata?: MetadataType;
}

interface SearchableType {
  count?: number;
  query: string;
  threshold?: number;
}

interface ObjectStoreConfigType extends S3ClientConfig {
  bucket: string;
}

interface LocalMCPServerConfig {
  args: string[];
  command: string;
  env?: Record<string, string>;
  type: 'local';
}

interface RemoteMCPServerConfig {
  headers?: Record<string, string>;
  type: 'remote';
  url: string;
}

type MCPServerConfigType = LocalMCPServerConfig | RemoteMCPServerConfig;

type MCPConfigType = Record<string, MCPServerConfigType>;

interface CommandOptionType {
  action?: (value: string) => unknown;
  default?: string | number | boolean;
  description: string;
  flags: string;
}

type AnyType = any | unknown;

interface KnowledgeBaseArticle {
  content: string;
  id: string;
  title: string;
  url: string;
}

interface KnowledgeBaseCategory {
  articles: KnowledgeBaseArticle[];
  category: string;
  id: string;
}

type ServiceConstructorType = new (...args: AnyType[]) => unknown;

interface UsageType {
  model: string;
  operation: 'generate_text' | 'stream_text' | 'generate_object' | 'embed_text';
  timestamp: string;
  tokens: {
    input?: number;
    output?: number;
    total?: number;
    reasoning?: number;
    cached?: number;
  };
}

export type {
  AIGenerateParams, AIMessage, AIObjectGenerateParams, AIResponseStreamPartType, AnyType, CommandOptionType, EmbeddingGenerateParams, IngestableType, KnowledgeBaseArticle, KnowledgeBaseCategory, MCPConfigType, MCPServerConfigType, MetadataType, ModelGenerationOptionsType, ObjectStoreConfigType, ProviderOptionsType, ProviderType, SearchableType, ServiceConstructorType, UsageType,
};
