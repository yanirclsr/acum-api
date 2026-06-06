import { describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { createHttpClient, acumGet, AcumError } from "./client.js";
import { ACUM_BASE_URL } from "./params.js";

describe("acumGet", () => {
  let http: ReturnType<typeof createHttpClient>;
  let mock: MockAdapter;

  beforeEach(() => {
    http = createHttpClient({ maxRetries: 0 });
    mock = new MockAdapter(http);
  });

  it("returns data on errorCode 0", async () => {
    mock.onGet("/searchdb").reply(201, {
      errorCode: 0,
      errorDescription: "ok",
      data: { results: [] },
    });
    const result = await acumGet(http, "/searchdb", { q: "test" });
    expect(result).toEqual({ results: [] });
  });

  it("throws AcumError on errorCode 4 (not found)", async () => {
    mock.onGet("/searchdb").reply(200, {
      errorCode: 4,
      errorDescription: "not found",
    });
    await expect(acumGet(http, "/searchdb", {})).rejects.toBeInstanceOf(AcumError);
  });

  it("throws AcumError on errorCode 2 (missing params)", async () => {
    mock.onGet("/getworkinfo").reply(200, {
      errorCode: 2,
      errorDescription: "missing params",
    });
    const err = await acumGet(http, "/getworkinfo", {}).catch(e => e);
    expect(err).toBeInstanceOf(AcumError);
    expect((err as AcumError).code).toBe(2);
  });

  it("strips undefined params from request", async () => {
    let capturedParams: Record<string, unknown> = {};
    mock.onGet("/searchdb").reply(config => {
      capturedParams = config.params ?? {};
      return [200, { errorCode: 0, data: {} }];
    });
    await acumGet(http, "/searchdb", { q: "test", page: undefined });
    expect(capturedParams).not.toHaveProperty("page");
    expect(capturedParams).toHaveProperty("q", "test");
  });
});
