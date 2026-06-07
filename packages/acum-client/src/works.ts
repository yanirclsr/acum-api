import type { AxiosInstance } from "axios";
import { acumGet } from "./client";
import { normalizeWorkBean } from "./normalize";
import type { WorkDetail } from "./types";

interface RawGetWorkInfoResponse {
  work: Record<string, unknown>;
  workVersionCount: number;
  workVersions: Record<string, unknown>[];
}

interface RawGetVersionInfoResponse {
  versionBean: Record<string, unknown>;
}

export async function getWork(http: AxiosInstance, workId: string): Promise<WorkDetail> {
  const raw = await acumGet<RawGetWorkInfoResponse>(http, "/getworkinfo", {
    workId,
  });

  const work = normalizeWorkBean(raw.work);
  const versions = (raw.workVersions ?? []).map(v => normalizeWorkBean(v));

  return { ...work, versions };
}

export async function getVersion(
  http: AxiosInstance,
  workId: string,
  versionId: string
) {
  const raw = await acumGet<RawGetVersionInfoResponse>(http, "/getversioninfo", {
    workId,
    versionId,
  });

  return normalizeWorkBean(raw.versionBean);
}
