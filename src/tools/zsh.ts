import { exec } from 'node:child_process';
import { tool } from 'ai';
import { z } from 'zod';

const zsh_tool = tool({
  description: 'a specialized execution tool for running zsh commands in a subprocess. use this when commands rely on zsh-specific syntax or features, such as advanced globbing, extended prompt substitution, or zsh plugins. prefer this tool over general shell execution when the user explicitly requires zsh capabilities to ensure accurate results.',
  inputSchema: z.object({
    command: z.string().nonoptional().describe('the zsh command to execute'),
  }).describe('the input to the zsh tool'),
  outputSchema: z.object({
    stdout: z.string().describe('the standard output of the command'),
    stderr: z.string().describe('the standard error of the command'),
  }).describe('the output of the zsh command'),
  execute: async ({ command }) => {
    return new Promise(resolve => exec(`zsh -c "${command}"`, (_error, stdout: string, stderr: string) => resolve({ stdout, stderr })));
  },
});

export { zsh_tool };
