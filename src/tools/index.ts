import { bash_tool } from './bash';
import { calculator_tool } from './calculator';
import { http_tool } from './http';
import { mcp_tools } from './mcp';
import { rag_search_tool } from './rag';
import { shell_tool } from './shell';
import { uuid_tool } from './uuid';
import { zsh_tool } from './zsh';

const tools = {
  bash_tool, calculator_tool, http_tool, rag_search_tool, shell_tool, uuid_tool, zsh_tool, ...mcp_tools,
};

export { tools };
