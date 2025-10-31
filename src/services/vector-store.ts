import { createHash } from 'node:crypto';
import type { Database } from '../database';
import type { IngestableType, SearchableType } from '../types';
import type { EmbeddingService } from './embedding';

const normalized = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');

class VectorStore {
  private database: Database;
  private service: EmbeddingService;
  constructor(database: Database, service: EmbeddingService) {
    this.database = database;
    this.service = service;
  }

  private queries = {
    pairs: {
      exists: 'select id from knowledge_pairs where content_hash = $1',
      insert: 'insert into knowledge_pairs (content, content_hash, embedding, metadata) values ($1, $2, $3, $4)',
      search: 'select id, content, metadata, 1 - (embedding <=> $1::vector) as similarity from knowledge_pairs where 1 - (embedding <=> $1::vector) >= $3 order by similarity desc limit $2',
    },
  };

  async ingest({ content: unsanitized_content, metadata }: IngestableType) {
    const content = normalized(unsanitized_content);
    const content_hash = createHash('sha256').update(content.replace(/\s+/g, '')).digest('hex');

    const { rows: existing = [] } = await this.database.query(this.queries.pairs.exists, [content_hash]);
    if (existing?.length) return { success: false, message: 'content already exists' };

    const { embeddings: [embedding] } = await this.service.generate({ content: [content], options: { embedding: true } });
    if (!embedding) return { success: false, message: 'failed to generate embedding' };
    await this.database.query(this.queries.pairs.insert, [content, content_hash, `[${embedding.join(', ')}]`, metadata]);

    return { success: true, message: 'content ingested successfully' };
  }

  async search({ query, count = 5, threshold = 0.7 }: SearchableType) {
    const { embeddings: [embedding] } = await this.service.generate({ content: [normalized(query)], options: { embedding: true } });
    if (!embedding) return { success: false, message: 'failed to generate embedding' };
    const { rows: results = [] } = await this.database.query(this.queries.pairs.search, [`[${embedding.join(', ')}]`, count, threshold]);

    return results.map(({ content, metadata }) => ({ content, source: `${metadata?.source}: ${metadata?.url || metadata?.description || 'internal'}` }));
  }
}

export { VectorStore };
