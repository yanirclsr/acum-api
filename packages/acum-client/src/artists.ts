import type { AxiosInstance } from "axios";
import { acumGet, AcumError } from "./client.js";
import { normalizeWorkBean } from "./normalize.js";
import type { Work, SearchCreatorWorksParams, SearchResult } from "./types.js";

interface RawSearchDBResponse {
  resultTypeInfos: Array<{
    resultTypeKey: string;
    count: number;
    pageResults: Record<string, unknown>[];
  }>;
}

export async function getCreatorWorks(
  http: AxiosInstance,
  params: SearchCreatorWorksParams
): Promise<SearchResult> {
  const page = params.page ?? 1;

  const query: Record<string, string | number | undefined> = {
    creatorId: params.creatorIpBaseNumber,
    resultSortTypeKey: params.sort ?? "alphabetical",
    pageNumber: page,
  };

  if (params.category) {
    query.resultTypeKey = params.category;
  }

  let raw: RawSearchDBResponse;
  try {
    raw = await acumGet<RawSearchDBResponse>(http, "/searchdb", query);
  } catch (err) {
    if (err instanceof AcumError && err.code === 4) {
      return { total: 0, page, limit: 10, results: [] };
    }
    throw err;
  }

  const relevant = raw.resultTypeInfos?.find(
    r =>
      r.resultTypeKey === "musical" ||
      r.resultTypeKey === "literature" ||
      r.resultTypeKey === "medley" ||
      r.resultTypeKey === "translated" ||
      r.resultTypeKey === (params.category ?? "musical")
  );

  if (!relevant) {
    return { total: 0, page, limit: 10, results: [] };
  }

  const results: Work[] = (relevant.pageResults ?? []).map(r => normalizeWorkBean(r));
  return { total: relevant.count, page, limit: 10, results };
}
