import { exec } from 'node:child_process';
import { tool } from 'ai';
import { z } from 'zod';

const bash_tool = tool({
  description: 'a specialized execution tool for running bash commands in a subprocess. use this when commands rely on bash-specific syntax, operators, or advanced features (e.g., process substitution, extended globbing, arrays, or complex scripting constructs). prefer this tool over general shell execution when the command explicitly requires bash semantics to ensure compatibility and correct behavior.',
  inputSchema: z.object({
    command: z.string().nonoptional().describe('the bash command to execute'),
  }).describe('the input to the bash tool'),
  outputSchema: z.object({
    stdout: z.string().describe('the standard output of the command'),
    stderr: z.string().describe('the standard error of the command'),
  }).describe('the output of the bash command'),
  execute: async ({ command }) => {
    return new Promise(resolve => exec(`bash -c "${command}"`, (_error, stdout: string, stderr: string) => resolve({ stdout, stderr })));
  },
});

export { bash_tool };
