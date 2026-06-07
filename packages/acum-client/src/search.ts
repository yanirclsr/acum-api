import type { AxiosInstance } from "axios";
import { acumGet, AcumError } from "./client";
import { normalizeWorkBean, normalizeArtistBean } from "./normalize";
import { PRIMARY_SEARCH_KEY, SECONDARY_SEARCH_KEY } from "./params";
import type {
  SearchWorksParams,
  SearchResult,
  ArtistSearchResult,
  Work,
  Artist,
} from "./types";

interface RawResultTypeInfo {
  resultTypeKey: string;
  count: number;
  pageResults: Record<string, unknown>[];
}

interface RawSearchDBResponse {
  resultTypeInfos: RawResultTypeInfo[];
  personHebName?: string;
  personEngName?: string;
}

export async function searchWorks(
  http: AxiosInstance,
  params: SearchWorksParams
): Promise<SearchResult> {
  const byKey = PRIMARY_SEARCH_KEY[params.by ?? "title"];
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const query: Record<string, string | number | undefined> = {
    primarySearchByTypeKey: byKey,
    primarySearchByTypeText: params.q,
    searchMethodTypeKey: params.method ?? "partial",
    resultSortTypeKey: params.sort ?? "alphabetical",
    pageNumber: page,
  };

  if (params.secondaryQ && params.secondaryBy) {
    query.secondarySearchByTypeKey = SECONDARY_SEARCH_KEY[params.secondaryBy] ?? undefined;
    query.secondarySearchByTypeText = params.secondaryQ;
  }

  if (params.category) {
    query.resultTypeKey = params.category;
  }

  let raw: RawSearchDBResponse;
  try {
    raw = await acumGet<RawSearchDBResponse>(http, "/searchdb", query);
  } catch (err) {
    if (err instanceof AcumError && err.code === 4) {
      return { total: 0, page, limit, results: [] };
    }
    throw err;
  }

  const musicalInfo = raw.resultTypeInfos?.find(
    r => r.resultTypeKey === "musical" ||
         r.resultTypeKey === "literature" ||
         r.resultTypeKey === "medley" ||
         r.resultTypeKey === "translated"
  );

  if (!musicalInfo) {
    return { total: 0, page, limit, results: [] };
  }

  const results: Work[] = (musicalInfo.pageResults ?? []).map(
    r => normalizeWorkBean(r)
  );

  return { total: musicalInfo.count, page, limit, results };
}

export async function searchArtists(
  http: AxiosInstance,
  params: SearchWorksParams
): Promise<ArtistSearchResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const query: Record<string, string | number | undefined> = {
    primarySearchByTypeKey: "2",
    primarySearchByTypeText: params.q,
    searchMethodTypeKey: params.method ?? "partial",
    resultSortTypeKey: params.sort ?? "alphabetical",
    pageNumber: page,
    resultTypeKey: "artist",
  };

  let raw: RawSearchDBResponse;
  try {
    raw = await acumGet<RawSearchDBResponse>(http, "/searchdb", query);
  } catch (err) {
    if (err instanceof AcumError && err.code === 4) {
      return { total: 0, page, limit, results: [] };
    }
    throw err;
  }

  const artistInfo = raw.resultTypeInfos?.find(r => r.resultTypeKey === "artist");
  if (!artistInfo) {
    return { total: 0, page, limit, results: [] };
  }

  const results: Artist[] = (artistInfo.pageResults ?? []).map(
    r => normalizeArtistBean(r)
  );

  return { total: artistInfo.count, page, limit, results };
}
