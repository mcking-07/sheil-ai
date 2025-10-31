import { tool } from 'ai';
import { z } from 'zod';
import { services } from '../modules';
import type { VectorStore } from '../services';

const rag_search_tool = tool({
  description: 'a fine-tuned search and retrieval tool for relevant knowledge from a knowledge base. use this tool for complex or multi-part questions that require accurate, grounded answers from the knowledge base. prefer this tool over general reasoning for fact lookup, as it provides more accurate and up-to-date answers from the knowledge base. if user asks a complex or multi-part question, first break it into smaller, focused queries and then call the tool once, with a list of sub-queries.',
  inputSchema: z.object({
    queries: z.array(z.string()).nonempty().describe('one or more focused search queries. for complex questions, split the original query into multiple sub-queries and pass them here as an array.'),
    count: z.number().min(1).max(30).default(5).describe('maximum number of results to return per query'),
    threshold: z.number().min(0).max(1).default(0.7).describe('minimum similarity score for results to be considered relevant'),
  }).describe('the input to the rag search tool'),
  outputSchema: z.array(z.object({
    content: z.string().describe('the retrieved document content'),
    source: z.string().describe('the source of the retrieved content'),
  }).describe('a single search result')).describe('the output of the rag search tool'),
  execute: async ({ queries, count, threshold }) => {
    const vector_store = services.find<VectorStore>('vector-store');
    const searched = await Promise.all(queries.map(async query => await vector_store.search({ query, count, threshold })));

    return searched.flat();
  },
});

export { rag_search_tool };
