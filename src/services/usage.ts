import fs from 'node:fs';
import path from 'node:path';
import type { EmbeddingModelUsage, LanguageModelUsage } from 'ai';
import type { UsageType } from '../types';

class UsageTracker {
  private usage_directory = path.join(path.resolve('./usage'));

  constructor() {
    this.ensure_directory();
  }

  private ensure_directory() {
    const directory_exists = fs.existsSync(this.usage_directory);
    if (!directory_exists) fs.mkdirSync(this.usage_directory, { recursive: true });
  }

  track(model: string, operation: UsageType['operation'], usage: LanguageModelUsage | EmbeddingModelUsage) {
    const timestamp = new Date().toISOString();

    const filename = `${timestamp.split('T')[0]}.jsonl`;
    const filepath = path.join(this.usage_directory, filename);

    const tokens = {
      ...('tokens' in usage ? { total: usage.tokens } : {
        input: usage?.inputTokens, output: usage?.outputTokens, total: usage?.totalTokens, reasoning: usage?.outputTokenDetails?.reasoningTokens, cached: usage?.inputTokenDetails?.cacheReadTokens,
      }),
    };

    const usage_entry: UsageType = { model, operation, tokens, timestamp };
    fs.appendFileSync(filepath, `${JSON.stringify(usage_entry)}\n`);
  }
}

export { UsageTracker };
