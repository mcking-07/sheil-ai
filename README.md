# sheil-ai

[![ai-sdk](https://img.shields.io/badge/ai_sdk-v6-black.svg)](https://sdk.vercel.ai)
[![anthropic](https://img.shields.io/badge/anthropic-claude-d97757.svg)](https://anthropic.com)
[![google](https://img.shields.io/badge/google-gemini-4796E3.svg)](https://gemini.google.com)
[![openai](https://img.shields.io/badge/openai-gpt-100000.svg)](https://openai.com)
[![ollama](https://img.shields.io/badge/ollama-CAAD8D.svg)](https://ollama.com)
[![openrouter](https://img.shields.io/badge/openrouter-7C3AED.svg)](https://openrouter.ai)
[![postgresql](https://img.shields.io/badge/postgresql-18-336791.svg)](https://www.postgresql.org)
[![pgvector](https://img.shields.io/badge/pgvector-0.5.0-7C3AED.svg)](https://github.com/pgvector/pgvector)
[![license](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

a modular ai cli that unifies multiple model providers with built-in rag, embeddings, pluggable tools, and mcp support.

## features

- **multi-provider support**: anthropic (claude), google (gemini), openai (gpt), ollama, openrouter
- **rag system**: vector-based knowledge retrieval with postgresql + pgvector
- **mcp support**: context7, exa, and filesystem integration, extendable via config
- **comprehensive toolset**: web search, shell execution, calculations, http requests, uuid generation
- **interactive chat**: session management with conversation history
- **knowledge base**: web scraping and content ingestion pipeline
- **configurable parameters**: temperature, tokens, reasoning modes, tool usage

## quick start

### prerequisites

- node.js v24.7.0+ (see `.nvmrc`)
- postgresql with pgvector and uuid-ossp extension
- docker and docker compose (for migrations)

### installation

```bash
# clone repository
git clone https://github.com/mcking-07/sheil-ai.git
cd sheil-ai

# install dependencies
npm install

# set up environment
cp .env.example .env
# edit .env with your api keys
```

### database setup

```bash
# start postgresql with pgvector and run migrations
docker-compose up
```

### usage

```bash
# start interactive chat
npm run chat

# with specific model
npm run chat -- --model opus-4.6

# load existing session
npm run chat -- --session my-session

# search knowledge base
npm run chat -- search --query "shipping rates" --count 10

# custom parameters
npm run chat -- --temperature 0.7 --max-tokens 1000 --reasoning-effort high
```

## configuration

### ai models

**language models:**

- `claude-haiku-4.5`, `claude-opus-4.6` (anthropic)
- `gemini-3-pro`, `gemini-3-flash` (google)
- `gpt-5.3-codex`, `gpt-5.1-codex-mini` (openai)
- `qwen3-mini`, `deepseek`, `tiger-gemma`, `phi4-mini` (ollama)
- `minimax-m2.5`, `grok-4.1-fast`, `kimi-k2.5`, `gpt-oss-120b` (openrouter)

**embedding models:**

- `embedding:gemini-001` (google)
- `embedding:nomic` (ollama)
- `embedding:mxbai-large` (ollama)
- `embedding:snowflake` (ollama)

models can be extended by registering new ones in the service registry:

```typescript
// register a new language model
services.register('ai:<my-model-identifier>', AIService, providers.<provider>.languageModel('model-name'));

// example (openai gpt 5.1 mini)
services.register('ai:gpt-5.1-mini', AIService, providers.openai.languageModel('gpt-5.1-codex-mini'));

// register a new embedding model
services.register('embedding:<my-embedding-identifier>', EmbeddingService, providers.<provider>.embeddingModel('embedding-model-name'));

// example (openai text embedding 3 small)
services.register('embedding:openai-small', EmbeddingService, providers.openai.embeddingModel('text-embedding-3-small'));

// use it in chat (only language models)
npm run chat -- --model <my-model-identifier>
```

### tools

- **rag_search_tool**: search internal knowledge base
- **web_search_tool**: web search with content extraction
- **calculator_tool**: mathematical expression evaluation
- **shell_tool/bash_tool**: command execution
- **http_tool**: rest api interactions
- **uuid_tool**: uuid generation
- **mcp_tools (extendable)**: mcp server tools (context7, exa, filesystem)

### web_search_tool (deprecated)

the `web_search_tool` uses `google-sr` which was **[permanently deprecated](https://github.com/typicalninja/google-sr/issues/103) on december 20, 2025**.

- **reason:** google has blocked non-javascript requests and is taking legal action against scraping services.
- **status:** the tool will continue to work for now but may stop functioning at any time.
- **recommendation:** use the **exa mcp tool** (`web_search_exa`) via the configured mcp server.

### parameters

| flag                          | description                     | default  |
| ----------------------------- | ------------------------------- | -------- |
| `--model`                     | ai model to use                 | `flash`  |
| `--temperature`               | response creativity (0.0-2.0)   | `0.5`    |
| `--max-tokens`                | response length limit           | -        |
| `--top-p`                     | nucleus sampling parameter      | `0.9`    |
| `--top-k`                     | top-k sampling parameter        | `50`     |
| `--frequency-penalty`         | frequency penalty               | `0`      |
| `--presence-penalty`          | presence penalty                | `0`      |
| `--seed`                      | random seed for reproducibility | -        |
| `--no-reasoning`              | disable model reasoning         | `false`  |
| `--reasoning-effort`          | low/medium/high                 | `medium` |
| `--thinking-budget`           | token budget for reasoning      | -        |
| `--disable-parallel-tool-use` | disable parallel tool execution | `false`  |

## mcp support

mcp (model context protocol) allows extending the cli with external servers that provide tools and resources.

### configured mcp servers

**context7** (remote):

- documentation lookup for various libraries

**exa** (remote):

- web search with ai optimized results
- requires `EXA_API_KEY` in `.env`

**filesystem** (local):

- file access for the ai
- root directory configurable via `FILESYSTEM_ROOT`

### adding new mcp servers

add new servers to `src/config/config.ts`:

```typescript
mcp: {
  // remote mcp servers (examples)
  linear: {
    type: 'remote',
    url: 'https://linear.app/mcp',
    headers: { 'authorization': `Bearer <token>` },
  },
  // local mcp servers via npx (examples)
  "sequential-thinking": {
    type: 'local',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
  },
}
```

### using mcp tools

mcp tools are automatically available in chat:

```bash
npm run chat
# then ask questions that use mcp tools
```

## knowledge base management

### scraping websites

```bash
# run the scraping script
npm run ingest:remote
```

**note**: the script at `src/scripts/scrape-parse-ingest.ts` is an example. adapt it for your site by modifying the selectors in the file and updating the `KNOWLEDGE_BASE_URL` in `.env`, or create your own scraping script.

### manual content addition

```typescript
const vector_store = services.find<VectorStore>('vector-store');
await vector_store.ingest({ 
  content: "your content here",
  metadata: {  source: 'website',  url: 'https://example.com',  language: 'en',  tags: ['tag', 'topic'] }
});
```

## architecture

### core components

- **services**: ai, embedding, vector store, object store, incident manager
- **registry**: centralized service management and dependency injection
- **tools**: extensible tool system for enhanced ai capabilities
- **database**: postgresql with vector similarity search
- **chat**: interactive cli with session persistence

### service registry

the application uses a service registry pattern for dependency management:

```typescript
// register services
services.register('ai:opus-4.6', AIService, providers.anthropic.languageModel('claude-opus-4-6'));
services.register('vector-store', VectorStore, Database, EmbeddingService);

// use services
const ai_service = services.find<AIService>('ai:opus-4.6');
```

### vector store

powered by postgresql with pgvector for semantic search:

- content normalization and deduplication
- configurable similarity thresholds
- metadata-based filtering
- automatic embedding generation

## development

### adding new tools

1. create tool in `src/tools/`
2. export from `src/tools/index.ts`
3. tool automatically available in chat

## api keys required

- `ANTHROPIC_API_KEY`: claude models
- `GOOGLE_API_KEY`: gemini models
- `OPENAI_API_KEY`: gpt models
- `OLLAMA_BASE_URL`: ollama models
- `OPENROUTER_API_KEY`: openrouter models
- `DATABASE_URL`: postgresql connection
- `EXA_API_KEY`: exa web search (optional)

## contributing

contributions are welcome! please feel free to submit a pull request.

---

**note**: this project was created as a learning exercise to explore ai sdks, embedding models, rag systems (including ingestion pipelines and vector databases), and mcp integrations.
