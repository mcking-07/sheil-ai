import { convertToModelMessages, generateText, hasToolCall, type LanguageModel, smoothStream, stepCountIs, streamText } from 'ai';
import { provider_options_for, services } from '../modules';
import type { AIGenerateParams, AIObjectGenerateParams, ProviderType } from '../types';
import type { UsageTracker } from './usage';

class AIService {
  private readonly model: Exclude<LanguageModel, string>;
  private readonly provider: ProviderType;
  private readonly model_id: string;
  private readonly usage_tracker: UsageTracker;
  constructor(model: Exclude<LanguageModel, string>) {
    this.model = model;
    this.provider = model?.provider?.split('.')[0] as ProviderType;

    this.model_id = model?.modelId;
    this.usage_tracker = services.find<UsageTracker>('usage-tracker');
  }

  async generate_text({ messages, system, tools, options, params }: AIGenerateParams) {
    const response = await generateText({
      model: this.model,
      system,
      messages: await convertToModelMessages(messages),
      ...(tools && { tools }),
      stopWhen: [stepCountIs(50), hasToolCall('final_response')],
      ...(options && { providerOptions: { [this.provider]: provider_options_for[this.provider](options) } }),
      ...params,
      prepareStep: (options) => {
        return options;
      },
      onStepFinish: (_result) => { },
      // abortSignal: undefined,
    });
    this.usage_tracker.track(this.model_id, 'generate_text', response?.usage);
    return response;
  }

  async stream_text({ messages, system, tools, options, params }: AIGenerateParams) {
    const response = streamText({
      model: this.model,
      system,
      messages: await convertToModelMessages(messages),
      ...(tools && { tools }),
      stopWhen: [stepCountIs(50), hasToolCall('final_response')],
      ...(options && { providerOptions: { [this.provider]: provider_options_for[this.provider](options) } }),
      ...params,
      experimental_transform: smoothStream(),
      onAbort: (_event) => { },
      onChunk: (_event) => { },
      prepareStep: (options) => {
        return options;
      },
      onStepFinish: async (_result) => { },
      onFinish: async (event) => {
        this.usage_tracker.track(this.model_id, 'stream_text', event?.usage);
      },
      onError: (_event) => { },
    });
    return response;
  }

  async generate_object({ messages, system, tools, options, params, output }: AIObjectGenerateParams) {
    const response = await generateText({
      model: this.model,
      system,
      messages: await convertToModelMessages(messages),
      ...(tools && { tools }),
      ...(options && { providerOptions: { [this.provider]: provider_options_for[this.provider](options) } }),
      ...params,
      ...(output && { output }),
    });
    this.usage_tracker.track(this.model_id, 'generate_object', response?.usage);
    return response;
  }
}

export { AIService };
