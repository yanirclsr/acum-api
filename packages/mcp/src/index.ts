#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAcumMcpServer } from "./server";

(async () => {
  const server = createAcumMcpServer({
    baseUrl: process.env.ACUM_BASE_URL,
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
})();
