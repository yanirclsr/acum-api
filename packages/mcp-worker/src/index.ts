const ACUM_BASE_URL = "https://nocs.acum.org.il/acumsitesearchdb";

// ── param maps (from acum-client) ────────────────────────────────────────────

const PRIMARY_SEARCH_KEY: Record<string, string> = {
  title: "1", composer: "2", performer: "3",
  album: "4", catalog: "5", number: "6", artist: "2",
};

const POOL_MAP: Record<string, string> = { "1": "local", "2": "foreign" };
const WORK_CATEGORY_MAP: Record<string, string> = {
  "0": "musical", "9": "literature", M: "medley", T: "translated",
};
const PROFESSION_MAP: Record<string, string> = {
  "ק": "composer", "מ": "author", "קמ": "composer_author", "מול": "publisher",
};

// ── fetch-based ACUM client ───────────────────────────────────────────────────

interface AcumResponse<T> {
  errorCode: number;
  errorDescription: string;
  data?: T;
}

class AcumError extends Error {
  constructor(public code: number, public description: string) {
    super(`ACUM error ${code}: ${description}`);
  }
}

async function acumGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  baseUrl = ACUM_BASE_URL,
  maxRetries = 2,
): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      const body = (await res.json()) as AcumResponse<T>;
      if (body.errorCode !== 0 && body.errorCode !== undefined) {
        throw new AcumError(body.errorCode, body.errorDescription);
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

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── normalizers ───────────────────────────────────────────────────────────────

type Rec = Record<string, unknown>;

function parseCreatorBean(raw: Rec) {
  return {
    ipBaseNumber: String(raw.creatorIpBaseNumber ?? ""),
    nameHebrew: String(raw.creatorHebName ?? ""),
    nameEnglish: String(raw.creatorEngName ?? "") || undefined,
    roleCode: (raw.roleCode as string) || undefined,
    protectionStatus: (raw.protectionStatus as string) || undefined,
  };
}

function parsePerformerBean(raw: Rec) {
  return {
    id: String(raw.number ?? ""),
    nameHebrew: String(raw.performerHebName ?? ""),
    nameEnglish: String(raw.performerEngName ?? "") || undefined,
  };
}

function toCategory(workType: string, isLit: boolean, isMedley: boolean, isTranslated: boolean) {
  if (isMedley) return "medley";
  if (isTranslated) return "translated";
  if (WORK_CATEGORY_MAP[workType] === "literature" || isLit) return "literature";
  return "musical";
}

function normalizeWorkBean(raw: Rec) {
  const workId = String(raw.workId ?? raw.fullWorkId ?? "");
  const isMedley = raw.isMedley === "1" || raw.isMedley === 1;
  const isTranslated = raw.isTranslated === "1" || raw.isTranslated === 1;
  const isLit = String(raw.workType) === "9";
  const creatorFull = (raw.creators as Rec[] | undefined) ?? [];
  const composerBeans = (raw.composers as Rec[] | undefined) ?? [];
  const authorBeans = (raw.authors as Rec[] | undefined) ?? [];

  const composers = creatorFull.length
    ? creatorFull.filter(c => c.roleCode === "C" || c.roleCode === "CA").map(parseCreatorBean)
    : composerBeans.map(parseCreatorBean);
  const authors = creatorFull.length
    ? creatorFull.filter(c => c.roleCode === "A" || c.roleCode === "CA").map(parseCreatorBean)
    : authorBeans.map(parseCreatorBean);
  const arrangers = creatorFull.filter(c => c.roleCode === "AR" || c.roleCode === "AT").map(parseCreatorBean);
  const publishers = creatorFull.filter(c => ["E", "SE", "CO"].includes(c.roleCode as string)).map(parseCreatorBean);
  const performerRaw = raw.performer as Rec | undefined;

  return {
    id: workId,
    versionId: String(raw.versionId ?? "") || undefined,
    workNumber: String(raw.workNumber ?? ""),
    versionNumber: String(raw.versionNumber ?? "") || undefined,
    titleHebrew: String(raw.workHebName ?? ""),
    titleEnglish: String(raw.workEngName ?? "") || undefined,
    isForeign: Boolean(raw.workIsForeign),
    pool: POOL_MAP[String(raw.pool ?? "")] ?? "local",
    category: toCategory(String(raw.workType ?? "0"), isLit, isMedley, isTranslated),
    registrationDate: String(raw.registration_date ?? "") || undefined,
    publicationDate: String(raw.publication_date ?? "") || undefined,
    composers, authors,
    arrangers: arrangers.length ? arrangers : undefined,
    publishers: publishers.length ? publishers : undefined,
    performer: performerRaw ? parsePerformerBean(performerRaw) : undefined,
    iswc: String(raw.versionIswcNumber ?? "") || undefined,
    isrc: String(raw.versionIsrcNumber ?? "") || undefined,
    duration: String(raw.time ?? "") || undefined,
    acumUrl: `${ACUM_BASE_URL}/work?workid=${workId}`,
  };
}

function normalizeArtistBean(raw: Rec) {
  const mainIp = raw.artistMainIp as Rec | undefined;
  return {
    ipBaseNumber: String(raw.number ?? ""),
    nameHebrew: String(raw.artistHebName ?? ""),
    nameEnglish: String(raw.artistEngName ?? "") || undefined,
    workCount: parseInt(String(raw.artistWorkCount ?? "0"), 10),
    versionCount: parseInt(String(raw.artistVersionCount ?? "0"), 10),
    profession: PROFESSION_MAP[String(raw.artistProfession ?? "")] ?? "other",
    joinYear: String(raw.artistJoinYear ?? "") || undefined,
    ipnNumber: mainIp ? String(mainIp.artistIpnNumber ?? "") || undefined : undefined,
    caeNumber: mainIp ? String(mainIp.artistCaeNumber ?? "") || undefined : undefined,
  };
}

// ── tool implementations ──────────────────────────────────────────────────────

interface SearchDbResponse {
  resultTypeInfos: Array<{ resultTypeKey: string; count: number; pageResults: Rec[] }>;
}

async function searchWorks(args: Record<string, unknown>, baseUrl: string) {
  const q = args.q as string;
  const by = (args.by as string) ?? "title";
  const page = (args.page as number) ?? 1;
  const limit = (args.limit as number) ?? 10;

  let raw: SearchDbResponse;
  try {
    raw = await acumGet<SearchDbResponse>("/searchdb", {
      primarySearchByTypeKey: PRIMARY_SEARCH_KEY[by] ?? "1",
      primarySearchByTypeText: q,
      searchMethodTypeKey: (args.method as string) ?? "partial",
      resultSortTypeKey: (args.sort as string) ?? "alphabetical",
      pageNumber: page,
    }, baseUrl);
  } catch (err) {
    if (err instanceof AcumError && err.code === 4) return { total: 0, page, limit, results: [] };
    throw err;
  }

  const info = raw.resultTypeInfos?.find(r =>
    ["musical", "literature", "medley", "translated"].includes(r.resultTypeKey));
  if (!info) return { total: 0, page, limit, results: [] };
  return { total: info.count, page, limit, results: info.pageResults.map(normalizeWorkBean) };
}

async function searchArtists(args: Record<string, unknown>, baseUrl: string) {
  const page = (args.page as number) ?? 1;
  const limit = (args.limit as number) ?? 10;

  let raw: SearchDbResponse;
  try {
    raw = await acumGet<SearchDbResponse>("/searchdb", {
      primarySearchByTypeKey: "2",
      primarySearchByTypeText: args.q as string,
      searchMethodTypeKey: (args.method as string) ?? "partial",
      resultSortTypeKey: (args.sort as string) ?? "alphabetical",
      pageNumber: page,
      resultTypeKey: "artist",
    }, baseUrl);
  } catch (err) {
    if (err instanceof AcumError && err.code === 4) return { total: 0, page, limit, results: [] };
    throw err;
  }

  const info = raw.resultTypeInfos?.find(r => r.resultTypeKey === "artist");
  if (!info) return { total: 0, page, limit, results: [] };
  return { total: info.count, page, limit, results: info.pageResults.map(normalizeArtistBean) };
}

async function getWork(args: Record<string, unknown>, baseUrl: string) {
  const raw = await acumGet<{ work: Rec; workVersions: Rec[] }>("/getworkinfo", {
    workId: args.workId as string,
  }, baseUrl);
  return { ...normalizeWorkBean(raw.work), versions: (raw.workVersions ?? []).map(normalizeWorkBean) };
}

async function getVersion(args: Record<string, unknown>, baseUrl: string) {
  const raw = await acumGet<{ versionBean: Rec }>("/getversioninfo", {
    workId: args.workId as string,
    versionId: args.versionId as string,
  }, baseUrl);
  return normalizeWorkBean(raw.versionBean);
}

async function getArtistWorks(args: Record<string, unknown>, baseUrl: string) {
  const page = (args.page as number) ?? 1;
  let raw: SearchDbResponse;
  try {
    raw = await acumGet<SearchDbResponse>("/searchdb", {
      creatorId: args.creatorIpBaseNumber as string,
      resultSortTypeKey: (args.sort as string) ?? "alphabetical",
      pageNumber: page,
    }, baseUrl);
  } catch (err) {
    if (err instanceof AcumError && err.code === 4) return { total: 0, page, limit: 10, results: [] };
    throw err;
  }

  const info = raw.resultTypeInfos?.find(r =>
    ["musical", "literature", "medley", "translated"].includes(r.resultTypeKey));
  if (!info) return { total: 0, page, limit: 10, results: [] };
  return { total: info.count, page, limit: 10, results: info.pageResults.map(normalizeWorkBean) };
}

// ── MCP tool definitions ──────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "search_works",
    description: "Search ACUM's database for musical works by title, composer, performer, album, catalog, or work number. Returns paginated results with Hebrew/English titles, composers, authors, and performers.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query text" },
        by: { type: "string", enum: ["title", "composer", "performer", "album", "catalog", "number"], description: "Field to search by (default: title)" },
        method: { type: "string", enum: ["partial", "exact"], description: "Match method (default: partial)" },
        sort: { type: "string", enum: ["alphabetical", "reverse"], description: "Sort order (default: alphabetical)" },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page, max 30 (default: 10)" },
      },
      required: ["q"],
    },
  },
  {
    name: "get_work",
    description: "Get full details for a specific musical work by its ACUM work ID, including all versions, creators, ISWC, and registration dates.",
    inputSchema: {
      type: "object",
      properties: { workId: { type: "string", description: "ACUM work ID (e.g. 1579291)" } },
      required: ["workId"],
    },
  },
  {
    name: "get_version",
    description: "Get details for a specific version of a musical work.",
    inputSchema: {
      type: "object",
      properties: {
        workId: { type: "string", description: "ACUM work ID" },
        versionId: { type: "string", description: "ACUM version ID — full ID with 3-digit suffix (e.g. 1579291001)" },
      },
      required: ["workId", "versionId"],
    },
  },
  {
    name: "search_artists",
    description: "Search for artists (composers, authors, performers) in the ACUM database by name.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Artist name to search" },
        method: { type: "string", enum: ["partial", "exact"], description: "Match method (default: partial)" },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page, max 30 (default: 10)" },
      },
      required: ["q"],
    },
  },
  {
    name: "get_artist_works",
    description: "Get all works registered to a specific artist/creator by their ACUM IP base number.",
    inputSchema: {
      type: "object",
      properties: {
        creatorIpBaseNumber: { type: "string", description: "Creator's ACUM IP base number (e.g. I-000151826-7)" },
        page: { type: "number", description: "Page number (default: 1)" },
        sort: { type: "string", enum: ["alphabetical", "reverse"], description: "Sort order (default: alphabetical)" },
      },
      required: ["creatorIpBaseNumber"],
    },
  },
];

// ── MCP JSON-RPC handler ──────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function ok(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function err(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

async function handleMcp(req: JsonRpcRequest, baseUrl: string): Promise<Response> {
  const { id, method, params } = req;

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "acum-mcp", version: "0.1.0" },
    });
  }

  if (method === "notifications/initialized") {
    return new Response(null, { status: 204 });
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = params?.name as string;
    const args = (params?.arguments ?? {}) as Record<string, unknown>;

    try {
      let result: unknown;
      if (name === "search_works") result = await searchWorks(args, baseUrl);
      else if (name === "get_work") result = await getWork(args, baseUrl);
      else if (name === "get_version") result = await getVersion(args, baseUrl);
      else if (name === "search_artists") result = await searchArtists(args, baseUrl);
      else if (name === "get_artist_works") result = await getArtistWorks(args, baseUrl);
      else return ok(id, { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true });

      return ok(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return ok(id, { content: [{ type: "text", text: msg }], isError: true });
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}

// ── CF Worker entry point ─────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: { ACUM_BASE_URL?: string }): Promise<Response> {
    const baseUrl = env.ACUM_BASE_URL ?? ACUM_BASE_URL;

    if (request.method === "GET") {
      return new Response("ACUM MCP Server — POST /mcp with JSON-RPC 2.0", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body: JsonRpcRequest;
    try {
      body = await request.json() as JsonRpcRequest;
    } catch {
      return err(null, -32700, "Parse error");
    }

    if (body.jsonrpc !== "2.0" || !body.method) {
      return err(body.id ?? null, -32600, "Invalid Request");
    }

    const response = await handleMcp(body, baseUrl);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  },
};
