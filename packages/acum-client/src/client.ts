import axios, { AxiosInstance, AxiosResponse } from "axios";
import { ACUM_BASE_URL } from "./params";
import type { AcumClientConfig } from "./types";

export interface AcumResponse<T = unknown> {
  errorCode: number;
  errorDescription: string;
  data?: T;
}

export class AcumError extends Error {
  constructor(
    public readonly code: number,
    public readonly description: string,
    message: string
  ) {
    super(message);
    this.name = "AcumError";
  }
}

export function createHttpClient(config: AcumClientConfig = {}): AxiosInstance {
  const baseURL = config.baseUrl ?? ACUM_BASE_URL;
  const timeout = config.timeoutMs ?? 10_000;

  return axios.create({
    baseURL,
    timeout,
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Charset": "utf-8",
    },
  });
}

export async function acumGet<T>(
  http: AxiosInstance,
  path: string,
  params: Record<string, string | number | undefined>,
  maxRetries = 2
): Promise<T> {
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") clean[k] = v;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res: AxiosResponse<AcumResponse<T>> = await http.get(path, { params: clean });
      const body = res.data;

      if (body.errorCode !== 0 && body.errorCode !== undefined) {
        throw new AcumError(
          body.errorCode,
          body.errorDescription,
          `ACUM error ${body.errorCode}: ${body.errorDescription}`
        );
      }

      return body.data as T;
    } catch (err) {
      lastError = err;
      if (err instanceof AcumError) throw err;
      if (attempt < maxRetries) await sleep(200 * (attempt + 1));
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
