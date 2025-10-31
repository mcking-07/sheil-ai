import https from 'https';
import { tool } from 'ai';
import fetch, { type RequestInit } from 'node-fetch';
import { z } from 'zod';

const http_tool = tool({
  description: `a flexible http client tool for sending requests to external services or apis. supports get, post, put, and delete methods with optional headers and body. use this tool to fetch data, interact with rest apis, or integrate with webhooks. prefer this tool when structured, programmatic access to web resources is required instead of general web search.`,
  inputSchema: z.object({
    method: z.enum(['get', 'post', 'put', 'delete']).default('get').describe('the http method to use'),
    url: z.url().describe('the url to make the request to'),
    headers: z.record(z.string(), z.string()).optional().describe('optional headers to include in the request'),
    insecure: z.boolean().optional().default(false).describe('whether to allow insecure ssl certificates'),
    body: z.any().optional().describe('the body of the request, for post and put methods'),
  }).describe('the input to the http tool'),
  outputSchema: z.object({
    status: z.number().describe('the http status code of the response'),
    headers: z.record(z.string(), z.string()).describe('the headers of the response'),
    body: z.any().optional().nullable().describe('the body of the response'),
    error: z.string().optional().nullable().describe('the error message, if any'),
  }).describe('the output of the http tool'),
  execute: async ({ method, url, headers, insecure, body }) => {
    const options: RequestInit = {
      method, headers, ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
      ...(insecure ? { agent: new https.Agent({ rejectUnauthorized: false }) } : {}),
    };

    try {
      const response = await fetch(url, options);

      const response_headers = Object.fromEntries(response.headers.entries());
      const response_body = await response.text();

      return { status: response.status, headers: response_headers, body: response_body, error: null };
    } catch (error) {
      return { status: 500, headers: {}, body: null, error: error instanceof Error ? error.message : 'an unknown error occurred' };
    }
  },
});

export { http_tool };
