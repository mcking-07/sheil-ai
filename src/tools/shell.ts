import { exec } from 'node:child_process';
import { tool } from 'ai';
import { z } from 'zod';

const shell_tool = tool({
  description: 'a generic tool to execute commands in the default posix-compliant system shell (typically /bin/sh). best suited for simple, portable commands that do not require advanced bash- or zsh-specific features. prefer this tool for lightweight one-liners, system utilities, or commands that should work across environments without relying on extended shell functionality.',
  inputSchema: z.object({
    command: z.string().nonoptional().describe('the shell command to execute'),
  }).describe('the input to the shell tool'),
  outputSchema: z.object({
    stdout: z.string().describe('the standard output of the command'),
    stderr: z.string().describe('the standard error of the command'),
  }).describe('the output of the shell command'),
  execute: async ({ command }) => {
    return new Promise(resolve => exec(command, (_error, stdout: string, stderr: string) => resolve({ stdout, stderr })));
  },
});

export { shell_tool };
