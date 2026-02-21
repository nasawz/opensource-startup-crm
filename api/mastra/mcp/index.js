import { MCPServer } from "@mastra/mcp";
import { leadsAgent } from "../agents/leads-agent.js";
import {
  listLeadsTool,
  getLeadTool,
  createLeadTool,
  searchLeadsTool,
  getLeadsMetadataTool,
} from "../tools/index.js";

/**
 * Svelte CRM MCP Server
 *
 * 将 CRM 相关的 agents 和 tools 暴露为 MCP 服务
 * 支持通过 HTTP/SSE 协议被外部 MCP 客户端访问
 */
export const svelteCrmMcpServer = new MCPServer({
  id: "svelte-crm-mcp-server",
  name: "Svelte CRM MCP Server",
  description:
    "BottleCRM MCP 服务，提供客户管理、线索跟踪、销售机会、任务管理等 CRM 功能",
  version: "1.0.0",

  agents: {
    leadsAgent,
  },

  tools: {
    listLeadsTool,
    getLeadTool,
    createLeadTool,
    searchLeadsTool,
    getLeadsMetadataTool,
  },
});
