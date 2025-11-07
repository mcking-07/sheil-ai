import process from 'node:process';
import { description, name, version } from '../../package.json' assert { type: 'json' };
import type { MCPConfigType } from '../types';
import 'dotenv/config';

const system_prompts = {
  mixture_of_experts: `you are sheilai (Sheil-AI), an advanced mixture-of-experts ai assistant. you coordinate between multiple specialized experts (reasoning, coding, knowledge retrieval, web search, data gathering and analysis and so on) and decide which expert (or tool) to use for each part of the user's request. your goal is to provide the most accurate, relevant and helpful response by leveraging the strengths of each expert. always identify the nature of the query (knowledge lookup, coding, computation, reasoning, web search and so on). for factual or knowledge-based queries, use the rag_search_tool to retrieve relevant information. for open-ended web queries, use the web_search_tool to gather current information. for data retrieval or api interactions, use the http_tool. for mathematical calculations or data analysis, use calculator_tool. for system commands or coding tasks, use shell_tool and or bash_tool. when uncertain, break down the problem into sub-queries and invoke multiple tools in parallel. you can always invoke more than one tool in parallel if required. never fabricate knowledge or answers. route requests to the appropriate expert based on their specialization. be concise, accurate and helpful. reason carefully over retrieved information before responding. feel free to use the tools at your disposal (and parallelize requests when appropriate).`,
};

const config = {
  application: {
    name,
    description,
    version,
    commands: {
      chat: {
        name: 'chat',
        description: 'start an interactive chat session with sheil-ai',
        options: [
          { flags: '-m, --model <string>', description: 'the ai model to use', action: undefined, default: 'gemini-2.5-flash' },
          { flags: '-s, --session <string>', description: 'load an existing chat session', action: undefined },
          { flags: '--max-tokens <number>', description: 'set the maximum number of tokens for the response', action: parseInt },
          { flags: '--temperature <number>', description: 'set the temperature for the response', action: parseFloat, default: 0.5 },
          { flags: '--top-p <number>', description: 'set the top-p for the response', action: parseFloat, default: 0.9 },
          { flags: '--top-k <number>', description: 'set the top-k for the response', action: parseInt, default: 50 },
          { flags: '--frequency-penalty <number>', description: 'set the frequency penalty for the response', action: parseFloat, default: 0 },
          { flags: '--presence-penalty <number>', description: 'set the presence penalty for the response', action: parseFloat, default: 0 },
          { flags: '--seed <number>', description: 'set the seed for the response', action: parseInt },
          { flags: '--no-reasoning', description: 'disable reasoning for the response', action: undefined, default: false },
          { flags: '--reasoning-effort <level>', description: 'set the reasoning effort (low, medium, high)', action: undefined, default: 'medium' },
          { flags: '--thinking-budget <number>', description: 'set the thinking budget for reasoning', action: parseInt },
          { flags: '--disable-parallel-tool-use', description: 'disable parallel tool use', action: undefined, default: false },
        ],
      },
      search: {
        name: 'search',
        description: 'search the knowledge base',
        options: [
          { flags: '-q, --query <text>', description: 'the search query', action: undefined },
          { flags: '--count <number>', description: 'the number of results to return', action: parseInt, default: 5 },
          { flags: '--threshold <number>', description: 'the minimum similarity score for a result', action: parseFloat, default: 0.7 },
        ],
      },
      models: {
        name: 'list-models',
        description: 'list all available ai models',
        options: [
          { flags: '-t, --type <string>', description: 'filter models by type (language, embedding)', action: undefined, default: 'language' },
        ],
      },
    },
  },
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    google: { apiKey: process.env.GOOGLE_API_KEY },
    openai: { apiKey: process.env.OPENAI_API_KEY },
    ollama: { name: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' },
    openrouter: { name: 'openrouter', apiKey: process.env.OPENROUTER_API_KEY, baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1' },
  },
  database: {
    connectionString: process.env.DATABASE_URL,
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  s3: {
    bucket: 'knowledge-base-bucket',
    region: 'us-west-1',
    endpoint: 'http://localhost:4566',
    forcePathStyle: true,
    credentials: {
      accessKeyId: '000000000000',
      secretAccessKey: '000000000000',
    },
  },
  prompts: {
    system: system_prompts.mixture_of_experts,
    generate_title: `generate a concise 3-5 word title for this conversation based on the user's first message. return only the title, no quotes or formatting.`,
    generate_content_pairs: `you are an ai assistant tasked with generating high-quality question–answer pairs from the provided content. these pairs will be used in a retrieval-augmented generation (RAG) system. your goal is to produce questions that resemble realistic user queries and answers that can function as standalone knowledge snippets suitable for retrieval. write questions that resemble natural search queries users might type when trying to solve a problem. prefer practical and actionable questions. avoid trivial questions, obvious questions, or questions that simply restate the title. each question should focus on a single concept, fact, configuration value, or step. avoid duplicate or nearly identical questions unless they represent meaningful natural variations that a user might realistically search for. answers must be concise, accurate, and fully self-contained. each answer should remain understandable without requiring any surrounding context. prefer answers that are one to three sentences long. do not reference the source text with phrases such as "as mentioned above", "in the article", or similar wording. do not assume outside knowledge and do not fabricate information. only use information that appears in the provided content. ensure the generated pairs cover the most important information, including key concepts, definitions, configuration values, credentials, urls, parameters, and important procedural steps. if the content describes a setup or configuration process, generate questions for the important individual steps. focus on information that helps a user complete a task, understand a feature, or troubleshoot an issue. avoid marketing language, opinions, or promotional phrasing. ensure every answer reflects factual information present in the content. prefer clear and specific wording that increases the likelihood that real user queries will match the questions during retrieval. generate between 15 and 50 high-quality question–answer pairs depending on how much useful information is available.`,
  },
  scripts: {
    ingest: {
      remote: process.env.KNOWLEDGE_BASE_URL,
      model: 'gemini-2.5-flash',
    },
  },
  mcp: {
    context7: {
      type: 'remote',
      url: 'https://mcp.context7.com/mcp',
    },
    exa: {
      type: 'remote',
      url: 'https://mcp.exa.ai/mcp',
      headers: { 'x-api-key': process.env.EXA_API_KEY },
    },
    filesystem: {
      type: 'local',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.env.FILESYSTEM_ROOT || process.env.HOME],
    },
  } as MCPConfigType,
} as const;

export { config };
