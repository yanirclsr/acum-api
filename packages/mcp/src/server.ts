import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  createHttpClient,
  searchWorks,
  searchArtists,
  getWork,
  getVersion,
  getCreatorWorks,
  AcumError,
} from "@acum-api/acum-client";
import type { AcumClientConfig } from "@acum-api/acum-client";

const TOOLS = [
  {
    name: "search_works",
    description:
      "Search ACUM (אקו״ם / אקום) database for musical works by title, composer, performer, album, catalog, or work number. Returns paginated results with Hebrew/English titles, composers, authors, and performers.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query text" },
        by: {
          type: "string",
          enum: ["title", "composer", "performer", "album", "catalog", "number"],
          description: "Field to search by (default: title)",
        },
        method: {
          type: "string",
          enum: ["partial", "exact"],
          description: "Match method (default: partial)",
        },
        sort: {
          type: "string",
          enum: ["alphabetical", "reverse"],
          description: "Sort order (default: alphabetical)",
        },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page, max 30 (default: 10)" },
      },
      required: ["q"],
    },
  },
  {
    name: "get_work",
    description:
      "Get full details for a specific musical work by its ACUM (אקו״ם) work ID, including all versions, creators, ISWC, and registration dates.",
    inputSchema: {
      type: "object",
      properties: {
        workId: { type: "string", description: "ACUM work ID (e.g. 1579291)" },
      },
      required: ["workId"],
    },
  },
  {
    name: "get_version",
    description: "Get details for a specific version of a musical work.",
    inputSchema: {
      type: "object",
      properties: {
        workId: { type: "string", description: "ACUM work ID (e.g. 1579291)" },
        versionId: {
          type: "string",
          description: "ACUM version ID — full ID with 3-digit suffix (e.g. 1579291001)",
        },
      },
      required: ["workId", "versionId"],
    },
  },
  {
    name: "search_artists",
    description:
      "Search for artists (composers, authors, performers) in the ACUM (אקו״ם / אקום) database by name.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Artist name to search" },
        method: {
          type: "string",
          enum: ["partial", "exact"],
          description: "Match method (default: partial)",
        },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page, max 30 (default: 10)" },
      },
      required: ["q"],
    },
  },
  {
    name: "get_artist_works",
    description:
      "Get all works registered to a specific artist/creator by their ACUM (אקו״ם) IP base number.",
    inputSchema: {
      type: "object",
      properties: {
        creatorIpBaseNumber: {
          type: "string",
          description: "Creator's ACUM IP base number (e.g. I-000151826-7)",
        },
        page: { type: "number", description: "Page number (default: 1)" },
        sort: {
          type: "string",
          enum: ["alphabetical", "reverse"],
          description: "Sort order (default: alphabetical)",
        },
      },
      required: ["creatorIpBaseNumber"],
    },
  },
] as const;

function formatError(err: unknown): string {
  if (err instanceof AcumError) {
    return `ACUM error (code ${err.code}): ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export function createAcumMcpServer(config?: AcumClientConfig) {
  const http = createHttpClient(config);

  const server = new Server(
    { name: "ACUM (אקו״ם)", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      if (name === "search_works") {
        const { q, by, method, sort, page, limit } = args as {
          q: string;
          by?: "title" | "composer" | "performer" | "album" | "catalog" | "number";
          method?: "partial" | "exact";
          sort?: "alphabetical" | "reverse";
          page?: number;
          limit?: number;
        };
        result = await searchWorks(http, { q, by, method, sort, page, limit });
      } else if (name === "get_work") {
        const { workId } = args as { workId: string };
        result = await getWork(http, workId);
      } else if (name === "get_version") {
        const { workId, versionId } = args as { workId: string; versionId: string };
        result = await getVersion(http, workId, versionId);
      } else if (name === "search_artists") {
        const { q, method, sort, page, limit } = args as {
          q: string;
          method?: "partial" | "exact";
          sort?: "alphabetical" | "reverse";
          page?: number;
          limit?: number;
        };
        result = await searchArtists(http, { q, method, sort, page, limit });
      } else if (name === "get_artist_works") {
        const { creatorIpBaseNumber, page, sort } = args as {
          creatorIpBaseNumber: string;
          page?: number;
          sort?: "alphabetical" | "reverse";
        };
        result = await getCreatorWorks(http, { creatorIpBaseNumber, page, sort });
      } else {
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: formatError(err) }],
        isError: true,
      };
    }
  });

  return server;
}
