import type {
  Work,
  Artist,
  Creator,
  Performer,
  ArtistProfession,
  Pool,
  WorkCategory,
  CreatorRole,
  ProtectionStatus,
} from "./types.js";
import { POOL_MAP, WORK_CATEGORY_MAP, PROFESSION_MAP, ACUM_BASE_URL } from "./params.js";

function toPool(raw: string | undefined): Pool {
  return POOL_MAP[raw ?? ""] ?? "local";
}

function toCategory(workType: string | undefined, isLit: boolean, isMedley: boolean, isTranslated: boolean): WorkCategory {
  if (isMedley) return "medley";
  if (isTranslated) return "translated";
  if (WORK_CATEGORY_MAP[workType ?? "0"] === "literature" || isLit) return "literature";
  return "musical";
}

function parseCreatorBean(raw: Record<string, unknown>): Creator {
  return {
    ipBaseNumber: String(raw.creatorIpBaseNumber ?? ""),
    nameHebrew: String(raw.creatorHebName ?? ""),
    nameEnglish: String(raw.creatorEngName ?? "") || undefined,
  };
}

function parseCreatorFullBean(raw: Record<string, unknown>): Creator {
  return {
    ipBaseNumber: String(raw.creatorIpBaseNumber ?? ""),
    nameHebrew: String(raw.creatorHebName ?? ""),
    nameEnglish: String(raw.creatorEngName ?? "") || undefined,
    roleCode: (raw.roleCode as CreatorRole) || undefined,
    protectionStatus: (raw.protectionStatus as ProtectionStatus) || undefined,
  };
}

function parsePerformerBean(raw: Record<string, unknown>): Performer {
  return {
    id: String(raw.number ?? ""),
    nameHebrew: String(raw.performerHebName ?? ""),
    nameEnglish: String(raw.performerEngName ?? "") || undefined,
  };
}

export function normalizeWorkBean(raw: Record<string, unknown>): Work {
  const workId = String(raw.workId ?? raw.fullWorkId ?? "");
  const versionId = String(raw.versionId ?? "") || undefined;
  const isMedley = raw.isMedley === "1" || raw.isMedley === 1;
  const isTranslated = raw.isTranslated === "1" || raw.isTranslated === 1;
  const isLit = String(raw.workType) === "9";

  const composerBeans = (raw.composers as Record<string, unknown>[] | undefined) ?? [];
  const authorBeans = (raw.authors as Record<string, unknown>[] | undefined) ?? [];
  const creatorFull = (raw.creators as Record<string, unknown>[] | undefined) ?? [];

  const composers: Creator[] = creatorFull.length
    ? creatorFull.filter(c => c.roleCode === "C" || c.roleCode === "CA").map(parseCreatorFullBean)
    : composerBeans.map(parseCreatorBean);

  const authors: Creator[] = creatorFull.length
    ? creatorFull.filter(c => c.roleCode === "A" || c.roleCode === "CA").map(parseCreatorFullBean)
    : authorBeans.map(parseCreatorBean);

  const arrangers: Creator[] = creatorFull
    .filter(c => c.roleCode === "AR" || c.roleCode === "AT")
    .map(parseCreatorFullBean);

  const publishers: Creator[] = creatorFull
    .filter(c => c.roleCode === "E" || c.roleCode === "SE" || c.roleCode === "CO")
    .map(parseCreatorFullBean);

  const performerRaw = raw.performer as Record<string, unknown> | undefined;

  return {
    id: workId,
    versionId,
    workNumber: String(raw.workNumber ?? ""),
    versionNumber: String(raw.versionNumber ?? "") || undefined,
    titleHebrew: String(raw.workHebName ?? ""),
    titleEnglish: String(raw.workEngName ?? "") || undefined,
    isForeign: Boolean(raw.workIsForeign),
    pool: toPool(String(raw.pool ?? "")),
    category: toCategory(String(raw.workType ?? "0"), isLit, isMedley, isTranslated),
    registrationDate: String(raw.registration_date ?? "") || undefined,
    publicationDate: String(raw.publication_date ?? "") || undefined,
    composers,
    authors,
    arrangers: arrangers.length ? arrangers : undefined,
    publishers: publishers.length ? publishers : undefined,
    performer: performerRaw ? parsePerformerBean(performerRaw) : undefined,
    iswc: String(raw.versionIswcNumber ?? "") || undefined,
    isrc: String(raw.versionIsrcNumber ?? "") || undefined,
    duration: String(raw.time ?? "") || undefined,
    versionCount: raw.workVersions
      ? parseInt(String((raw.workVersions as Record<string, unknown>).total ?? "0"), 10)
      : undefined,
    acumUrl: `${ACUM_BASE_URL}/work?workid=${workId}`,
  };
}

export function normalizeArtistBean(raw: Record<string, unknown>): Artist {
  const mainIp = raw.artistMainIp as Record<string, unknown> | undefined;
  const profession: ArtistProfession =
    PROFESSION_MAP[String(raw.artistProfession ?? "")] ?? "other";

  return {
    ipBaseNumber: String(raw.number ?? ""),
    nameHebrew: String(raw.artistHebName ?? ""),
    nameEnglish: String(raw.artistEngName ?? "") || undefined,
    workCount: parseInt(String(raw.artistWorkCount ?? "0"), 10),
    versionCount: parseInt(String(raw.artistVersionCount ?? "0"), 10),
    profession,
    joinYear: String(raw.artistJoinYear ?? "") || undefined,
    ipnNumber: mainIp ? String(mainIp.artistIpnNumber ?? "") || undefined : undefined,
    caeNumber: mainIp ? String(mainIp.artistCaeNumber ?? "") || undefined : undefined,
  };
}

export function normalizePerformerBean(raw: Record<string, unknown>): Performer {
  return parsePerformerBean(raw);
}
