import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@acum-api/acum-client", () => ({
  createHttpClient: vi.fn(() => ({})),
  searchWorks: vi.fn(),
  searchArtists: vi.fn(),
  getWork: vi.fn(),
  getVersion: vi.fn(),
  getCreatorWorks: vi.fn(),
  AcumError: class AcumError extends Error {
    constructor(public code: number, message: string) {
      super(message);
    }
  },
}));

import * as client from "@acum-api/acum-client";
import { createAcumMcpServer } from "./server";

function callTool(name: string, args: Record<string, unknown>) {
  const server = createAcumMcpServer();
  const handler = (server as unknown as {
    _requestHandlers: Map<string, (req: unknown) => Promise<unknown>>;
  })._requestHandlers.get("tools/call");
  return handler!({ method: "tools/call", params: { name, arguments: args } });
}

function listTools() {
  const server = createAcumMcpServer();
  const handler = (server as unknown as {
    _requestHandlers: Map<string, (req: unknown) => Promise<unknown>>;
  })._requestHandlers.get("tools/list");
  return handler!({ method: "tools/list", params: {} });
}

describe("acum MCP server", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists 5 tools", async () => {
    const res = await listTools() as { tools: unknown[] };
    expect(res.tools).toHaveLength(5);
  });

  it("search_works calls searchWorks and returns JSON", async () => {
    vi.mocked(client.searchWorks).mockResolvedValue({ total: 1, page: 1, limit: 10, results: [] });
    const res = await callTool("search_works", { q: "לילה" }) as {
      content: { type: string; text: string }[];
    };
    expect(client.searchWorks).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ q: "לילה" }));
    expect(res.content[0].type).toBe("text");
    expect(JSON.parse(res.content[0].text)).toMatchObject({ total: 1 });
  });

  it("get_work calls getWork", async () => {
    vi.mocked(client.getWork).mockResolvedValue({
      id: "1579291",
      versions: [],
    } as unknown as Awaited<ReturnType<typeof client.getWork>>);
    await callTool("get_work", { workId: "1579291" });
    expect(client.getWork).toHaveBeenCalledWith(expect.anything(), "1579291");
  });

  it("get_version calls getVersion", async () => {
    vi.mocked(client.getVersion).mockResolvedValue({} as Awaited<ReturnType<typeof client.getVersion>>);
    await callTool("get_version", { workId: "1579291", versionId: "1579291001" });
    expect(client.getVersion).toHaveBeenCalledWith(expect.anything(), "1579291", "1579291001");
  });

  it("search_artists calls searchArtists", async () => {
    vi.mocked(client.searchArtists).mockResolvedValue({ total: 0, page: 1, limit: 10, results: [] });
    await callTool("search_artists", { q: "שלמה ארצי" });
    expect(client.searchArtists).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ q: "שלמה ארצי" }));
  });

  it("get_artist_works calls getCreatorWorks", async () => {
    vi.mocked(client.getCreatorWorks).mockResolvedValue({ total: 0, page: 1, limit: 10, results: [] });
    await callTool("get_artist_works", { creatorIpBaseNumber: "I-000151826-7" });
    expect(client.getCreatorWorks).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ creatorIpBaseNumber: "I-000151826-7" }));
  });

  it("returns isError on AcumError", async () => {
    const { AcumError } = await import("@acum-api/acum-client");
    vi.mocked(client.getWork).mockRejectedValue(new AcumError(4, "not found"));
    const res = await callTool("get_work", { workId: "9999999" }) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("ACUM error");
  });

  it("returns isError for unknown tool", async () => {
    const res = await callTool("unknown_tool", {}) as { isError: boolean };
    expect(res.isError).toBe(true);
  });
});
