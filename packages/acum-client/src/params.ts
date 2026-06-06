import type { SearchByType, ArtistProfession } from "./types.js";

export const PRIMARY_SEARCH_KEY: Record<SearchByType, string> = {
  title: "1",
  composer: "2",
  performer: "3",
  album: "4",
  catalog: "5",
  number: "6",
  artist: "2",
};

export const SECONDARY_SEARCH_KEY: Record<string, string> = {
  composer: "1",
  artist: "1",
  performer: "2",
  album: "3",
};

export const POOL_MAP: Record<string, "local" | "foreign"> = {
  "1": "local",
  "2": "foreign",
};

export const WORK_CATEGORY_MAP: Record<string, string> = {
  "0": "musical",
  "9": "literature",
  M: "medley",
  T: "translated",
};

export const PROFESSION_MAP: Record<string, ArtistProfession> = {
  "ק": "composer",
  "מ": "author",
  "קמ": "composer_author",
  "מול": "publisher",
};

export const ACUM_BASE_URL = "https://nocs.acum.org.il/acumsitesearchdb";
