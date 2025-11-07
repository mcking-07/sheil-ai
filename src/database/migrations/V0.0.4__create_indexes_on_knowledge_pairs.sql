create index if not exists idx_knowledge_pairs_content_hash on knowledge_pairs (content_hash);
create index if not exists idx_knowledge_pairs_embedding_hnsw on knowledge_pairs using hnsw (embedding vector_cosine_ops);
create index if not exists idx_knowledge_pairs_metadata on knowledge_pairs using gin (metadata);
