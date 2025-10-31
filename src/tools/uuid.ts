import { tool } from 'ai';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

const uuid_tool = tool({
  description: 'a tool for generating universally unique identifiers (uuids, version 4). useful for creating unique keys, identifiers, or references in workflows. supports generating multiple uuids at once. prefer this tool whenever uniqueness and randomness are required, instead of manually crafting identifiers.',
  inputSchema: z.object({
    count: z.number().min(1).max(20).default(1).describe('the number of uuids to generate'),
  }).describe('the input to the uuid tool'),
  outputSchema: z.array(z.uuid()).describe('the generated uuids'),
  execute: async ({ count }) => {
    return Array.from({ length: count }, () => uuid());
  },
});

export { uuid_tool };
