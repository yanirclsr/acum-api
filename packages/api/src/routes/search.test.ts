import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { errorHandler } from "../middleware/errors.js";

vi.mock("@acum-api/acum-client", () => ({
  createHttpClient: vi.fn(() => ({})),
  searchWorks: vi.fn(),
  searchArtists: vi.fn(),
}));

import * as client from "@acum-api/acum-client";
import searchRouter from "./search.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/search", searchRouter);
  app.use(errorHandler);
  return app;
}

describe("GET /api/search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when q is missing", async () => {
    const res = await request(buildApp()).get("/api/search");
    expect(res.status).toBe(400);
  });

  it("calls searchWorks with correct params", async () => {
    vi.mocked(client.searchWorks).mockResolvedValue({
      total: 1,
      page: 1,
      limit: 10,
      results: [],
    });

    const res = await request(buildApp()).get(
      "/api/search?q=%D7%9C%D7%99%D7%9C%D7%94&by=title&method=partial"
    );
    expect(res.status).toBe(200);
    expect(client.searchWorks).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ q: "לילה", by: "title", method: "partial" })
    );
  });

  it("calls searchArtists when type=artists", async () => {
    vi.mocked(client.searchArtists).mockResolvedValue({
      total: 0,
      page: 1,
      limit: 10,
      results: [],
    });

    await request(buildApp()).get("/api/search?q=test&type=artists");
    expect(client.searchArtists).toHaveBeenCalled();
  });

  it("rejects limit > 30", async () => {
    const res = await request(buildApp()).get("/api/search?q=test&limit=100");
    expect(res.status).toBe(400);
  });
});
