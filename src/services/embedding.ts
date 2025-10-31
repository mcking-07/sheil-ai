import { type EmbeddingModel, embedMany } from 'ai';
import { provider_options_for, services } from '../modules';
import type { EmbeddingGenerateParams, ProviderType } from '../types';
import type { UsageTracker } from './usage';

class EmbeddingService {
  private readonly model: Exclude<EmbeddingModel, string>;
  private readonly provider: ProviderType;
  private readonly model_id: string;
  private readonly usage_tracker: UsageTracker;
  constructor(model: Exclude<EmbeddingModel, string>) {
    this.model = model;
    this.provider = model?.provider?.split('.')[0] as ProviderType;

    this.model_id = model?.modelId;
    this.usage_tracker = services.find<UsageTracker>('usage-tracker');
  }

  async generate({ content, options }: EmbeddingGenerateParams) {
    const response = await embedMany({
      model: this.model, values: content,
      ...(options && { providerOptions: { [this.provider]: provider_options_for[this.provider](options) } }),
    });

    this.usage_tracker.track(this.model_id, 'embed_text', response?.usage);
    return response;
  }
}

export { EmbeddingService };
