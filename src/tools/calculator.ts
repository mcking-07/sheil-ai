import { tool } from 'ai';
import { evaluate } from 'mathjs';
import { z } from 'zod';

const calculator_tool = tool({
  description: 'a tool for evaluating mathematical expressions using a robust math engine. use this when users provide formulas, equations, or calculations that need to be computed precisely (including arithmetic, algebra, trigonometry, or more advanced expressions). prefer this over manual reasoning to avoid mistakes in numeric computation and ensure consistent, reliable results.',
  inputSchema: z.object({
    expression: z.string().nonoptional().describe('the mathematical expression to evaluate'),
  }),
  outputSchema: z.string().describe('the result of the evaluation'),
  execute: async ({ expression }) => {
    const evaluated = evaluate(expression);

    return evaluated?.toString() || String(evaluated);
  },
});

export { calculator_tool };
