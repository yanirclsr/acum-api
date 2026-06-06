import { describe, it, expect } from "vitest";
import { normalizeWorkBean, normalizeArtistBean } from "./normalize.js";

const sampleWorkBean = {
  fullWorkId: "1579291",
  workId: "1579291",
  workNumber: "579291",
  workLanguage: "1",
  versionNumber: "",
  workHebName: "? מה מבקש להירפא הלילה",
  workEngName: "MA MEVAKESH LEHIRAPE HALAYLA ?",
  workIsForeign: false,
  pool: "1",
  registration_date: "27.01.2026",
  publication_date: "27.01.2026",
  workVersions: { total: "1" },
  authors: [
    {
      creatorHebName: "נוי אביטל",
      creatorEngName: "NOY AVITAL",
      creatorIpBaseNumber: "I-005091277-9",
    },
  ],
  composers: [
    {
      creatorHebName: "נוי אביטל",
      creatorEngName: "NOY AVITAL",
      creatorIpBaseNumber: "I-005091277-9",
    },
  ],
  isWork: "1",
  isVersion: "0",
  isMedley: "0",
  isTranslated: "0",
  workType: "0",
};

const sampleArtistBean = {
  number: "I-000151826-7",
  artistHebName: "שלמה ארצי",
  artistEngName: "SHLOMO ARTZI",
  artistWorkCount: "396",
  artistVersionCount: "114",
  artistProfession: "קמ",
  artistJoinYear: "1972",
  artistMainIp: {
    artistIpnNumber: "00064925460",
    artistCaeNumber: "649254",
    artistCaeName: "SHLOMO ARTZI",
  },
};

describe("normalizeWorkBean", () => {
  it("maps pool correctly", () => {
    const w = normalizeWorkBean(sampleWorkBean);
    expect(w.pool).toBe("local");
  });

  it("maps pool 2 to foreign", () => {
    const w = normalizeWorkBean({ ...sampleWorkBean, pool: "2" });
    expect(w.pool).toBe("foreign");
  });

  it("maps musical category", () => {
    const w = normalizeWorkBean(sampleWorkBean);
    expect(w.category).toBe("musical");
  });

  it("maps medley category", () => {
    const w = normalizeWorkBean({ ...sampleWorkBean, isMedley: "1" });
    expect(w.category).toBe("medley");
  });

  it("maps translated category", () => {
    const w = normalizeWorkBean({ ...sampleWorkBean, isTranslated: "1" });
    expect(w.category).toBe("translated");
  });

  it("maps literature category from workType 9", () => {
    const w = normalizeWorkBean({ ...sampleWorkBean, workType: "9" });
    expect(w.category).toBe("literature");
  });

  it("preserves Hebrew title", () => {
    const w = normalizeWorkBean(sampleWorkBean);
    expect(w.titleHebrew).toBe("? מה מבקש להירפא הלילה");
  });

  it("includes composers", () => {
    const w = normalizeWorkBean(sampleWorkBean);
    expect(w.composers).toHaveLength(1);
    expect(w.composers[0].ipBaseNumber).toBe("I-005091277-9");
  });

  it("sets versionCount from workVersions.total", () => {
    const w = normalizeWorkBean(sampleWorkBean);
    expect(w.versionCount).toBe(1);
  });

  it("builds acumUrl from id", () => {
    const w = normalizeWorkBean(sampleWorkBean);
    expect(w.acumUrl).toContain("workid=1579291");
  });
});

describe("normalizeArtistBean", () => {
  it("maps profession composer_author", () => {
    const a = normalizeArtistBean(sampleArtistBean);
    expect(a.profession).toBe("composer_author");
  });

  it("maps work count", () => {
    const a = normalizeArtistBean(sampleArtistBean);
    expect(a.workCount).toBe(396);
  });

  it("maps IPN number", () => {
    const a = normalizeArtistBean(sampleArtistBean);
    expect(a.ipnNumber).toBe("00064925460");
  });
});
