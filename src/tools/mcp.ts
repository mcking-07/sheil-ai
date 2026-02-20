import { createMCPClient } from '@ai-sdk/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { config } from '../config';
import type { MCPServerConfigType } from '../types';

const build_transport_for = (params: MCPServerConfigType) => {
  if (params.type === 'remote') {
    const { url, headers = {} } = params;
    return new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers } });
  }

  const { command, args, env } = params;
  return new StdioClientTransport({ command, args, env });
};

const transports = Object.entries(config?.mcp || {}).map(([name, params]) => ({
  name, transport: build_transport_for(params),
}));

const promises = transports.map(async ({ name, transport }) => {
  const client = await createMCPClient({ name, transport });
  return await client.tools();
});

const mcp_tools = await Promise.all(promises).then(results => Object.assign({}, ...results));

export { mcp_tools };
