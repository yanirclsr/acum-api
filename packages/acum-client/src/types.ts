export interface Creator {
  ipBaseNumber: string;
  nameHebrew: string;
  nameEnglish?: string;
  roleCode?: CreatorRole;
  protectionStatus?: ProtectionStatus;
}

export type CreatorRole =
  | "A"   // Author/Lyricist
  | "C"   // Composer
  | "CA"  // Composer+Author
  | "AR"  // Arranger
  | "AT"  // Translator
  | "E"   // Publisher
  | "SE"  // Sub-publisher
  | "CO"  // Representing publisher
  | "PA"; // Publisher income participant

export type ProtectionStatus =
  | "1"  // Protected by ACUM
  | "2"  // Not specified
  | "3"; // Public domain

export type Pool = "local" | "foreign";
export type WorkCategory = "musical" | "literature" | "medley" | "translated";

export interface Work {
  id: string;
  versionId?: string;
  workNumber: string;
  versionNumber?: string;
  titleHebrew: string;
  titleEnglish?: string;
  isForeign: boolean;
  pool: Pool;
  category: WorkCategory;
  registrationDate?: string;
  publicationDate?: string;
  composers: Creator[];
  authors: Creator[];
  arrangers?: Creator[];
  publishers?: Creator[];
  performer?: Performer;
  iswc?: string;
  isrc?: string;
  duration?: string;
  versionCount?: number;
  acumUrl: string;
}

export interface Performer {
  id: string;
  nameHebrew: string;
  nameEnglish?: string;
}

export interface Artist {
  ipBaseNumber: string;
  nameHebrew: string;
  nameEnglish?: string;
  workCount: number;
  versionCount: number;
  profession: ArtistProfession;
  joinYear?: string;
  ipnNumber?: string;
  caeNumber?: string;
}

export type ArtistProfession = "composer" | "author" | "composer_author" | "publisher" | "other";

export interface SearchResult {
  total: number;
  page: number;
  limit: number;
  results: Work[];
}

export interface ArtistSearchResult {
  total: number;
  page: number;
  limit: number;
  results: Artist[];
}

export interface WorkDetail extends Work {
  versions: Work[];
}

export interface AcumClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export type SearchByType = "title" | "artist" | "composer" | "performer" | "album" | "catalog" | "number";
export type SearchMethod = "partial" | "exact";
export type SortOrder = "alphabetical" | "reverse";
export type ResultCategory = "musical" | "literature" | "medley" | "translated" | "album" | "artist" | "performer";

export interface SearchWorksParams {
  q: string;
  by?: SearchByType;
  secondaryQ?: string;
  secondaryBy?: "artist" | "composer" | "performer" | "album";
  method?: SearchMethod;
  sort?: SortOrder;
  page?: number;
  limit?: number;
  category?: ResultCategory;
}

export interface SearchCreatorWorksParams {
  creatorIpBaseNumber: string;
  category?: ResultCategory;
  page?: number;
  sort?: SortOrder;
}
