import { type AnthropicProviderOptions, createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI, type GoogleGenerativeAIEmbeddingProviderOptions, type GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { createOpenAI, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createOpenAICompatible, type OpenAICompatibleEmbeddingProviderOptions, type OpenAICompatibleProviderOptions } from '@ai-sdk/openai-compatible';
import { config } from '../config';
import type { ProviderOptionsType } from '../types';

const { providers: provider_config } = config;

const CHAT_PROVIDER_OPTIONS = {
  anthropic: {
    sendReasoning: false, thinking: { type: 'disabled' }, disableParallelToolUse: false,
  } satisfies AnthropicProviderOptions,
  google: {
    thinkingConfig: { includeThoughts: false, thinkingBudget: 1024 },
    structuredOutputs: false,
    safetySettings: [
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
    threshold: 'BLOCK_ONLY_HIGH',
  } satisfies GoogleGenerativeAIProviderOptions,
  openai: {
    reasoningEffort: 'low', parallelToolCalls: false, store: false,
  } satisfies OpenAIResponsesProviderOptions,
  ollama: {
    reasoningEffort: 'low',
  } satisfies OpenAICompatibleProviderOptions,
  openrouter: {
    reasoningEffort: 'low',
  } satisfies OpenAICompatibleProviderOptions,
} as const;

const EMBEDDING_PROVIDER_OPTIONS = {
  google: {
    outputDimensionality: 1024,
    taskType: 'SEMANTIC_SIMILARITY',
  } satisfies GoogleGenerativeAIEmbeddingProviderOptions,
  ollama: {
    dimensions: 1024,
  } satisfies OpenAICompatibleEmbeddingProviderOptions,
} as const;

const provider_options_for = {
  anthropic: (options: ProviderOptionsType) => ({
    ...CHAT_PROVIDER_OPTIONS.anthropic,
    ...(options.reasoning && { sendReasoning: true }),
    thinking: {
      ...CHAT_PROVIDER_OPTIONS.anthropic.thinking,
      ...(options.reasoning && { type: 'enabled' }),
      ...(options.thinkingBudget && { budgetTokens: options.thinkingBudget }),
    },
    ...(options.disableParallelToolUse && { disableParallelToolUse: true }),
  }) as AnthropicProviderOptions,
  google: (options: ProviderOptionsType) => ({
    ...(options?.embedding ? {
      ...EMBEDDING_PROVIDER_OPTIONS.google,
      ...(options.dimensions && { outputDimensionality: options.dimensions }),
    } : {
      ...CHAT_PROVIDER_OPTIONS.google,
      thinkingConfig: {
        ...CHAT_PROVIDER_OPTIONS.google.thinkingConfig,
        ...(options.reasoning && { includeThoughts: true }),
        ...(options.thinkingBudget && { thinkingBudget: options.thinkingBudget }),
      },
    }),
  }) as GoogleGenerativeAIProviderOptions | GoogleGenerativeAIEmbeddingProviderOptions,
  openai: (options: ProviderOptionsType) => ({
    ...CHAT_PROVIDER_OPTIONS.openai,
    ...(options.reasoningEffort && { reasoningEffort: options.reasoningEffort }),
  }) as OpenAIResponsesProviderOptions,
  ollama: (options: ProviderOptionsType) => ({
    ...(options?.embedding ? {
      ...EMBEDDING_PROVIDER_OPTIONS.ollama,
      ...(options.dimensions && { dimensions: options.dimensions }),
    } : {
      ...CHAT_PROVIDER_OPTIONS.ollama,
      ...(options.reasoningEffort && { reasoningEffort: options.reasoningEffort }),
    }),
  }) as OpenAICompatibleProviderOptions | OpenAICompatibleEmbeddingProviderOptions,
  openrouter: (options: ProviderOptionsType) => ({
    ...CHAT_PROVIDER_OPTIONS.openrouter,
    ...(options.reasoningEffort && { reasoningEffort: options.reasoningEffort }),
  }) as OpenAICompatibleProviderOptions,
};

const providers = {
  anthropic: createAnthropic({ ...provider_config.anthropic }),
  google: createGoogleGenerativeAI({ ...provider_config.google }),
  openai: createOpenAI({ ...provider_config.openai }),
  ollama: createOpenAICompatible({ ...provider_config.ollama }),
  openrouter: createOpenAICompatible({ ...provider_config.openrouter }),
} as const;

export { provider_options_for, providers };
