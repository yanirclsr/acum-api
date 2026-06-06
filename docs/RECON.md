# ACUM Search DB — Reconnaissance Findings

Conducted: 2026-06-06  
Base URL: `https://nocs.acum.org.il/acumsitesearchdb/`

---

## Summary

The ACUM search database is an AngularJS SPA. All data is served over **plain HTTPS REST JSON endpoints** — no authentication, no CORS restriction blocking server-side calls. The SPA HTML shell lives at `/work?workid=` and `/results?performerid=`, but the actual **JSON API endpoints** are different paths. There is no OAuth or login gate on any read endpoint.

---

## Session / Cookies

A `JSESSIONID` cookie is set on the first request (`Set-Cookie: JSESSIONID=...; Path=/acumsitesearchdb; Secure; HttpOnly`), but it is **not required** — subsequent requests work without sending it. Stateless calls are fine.

HTTP status on success: **201** (not 200). This is a backend quirk; responses always have `errorCode` in the body.

---

## Response Envelope

Every endpoint returns:
```json
{
  "errorCode": 0,
  "errorDescription": "לא נמצאו שגיאות שירות רץ בהצלחה",
  "data": { ... }
}
```

Error codes:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Missing parameters |
| 3 | Communication problem |
| 4 | Data not found |
| 5 | Authentication required |
| 6 | No permissions |

---

## Endpoints

### 1. `GET /searchdb` — Search works, artists, performers, albums

**All-purpose search.** Returns results grouped by `resultTypeKey`.

| Param | Type | Notes |
|-------|------|-------|
| `primarySearchByTypeKey` | int | See key map below |
| `primarySearchByTypeText` | string | URL-encoded UTF-8 (Hebrew works fine) |
| `secondarySearchByTypeKey` | int | Optional filter |
| `secondarySearchByTypeText` | string | Optional filter text |
| `searchMethodTypeKey` | `partial` \| `exact` | Default: partial |
| `resultSortTypeKey` | `alphabetical` \| `reverse` | Default: alphabetical |
| `pageNumber` | int | 1-based |
| `resultTypeKey` | string | Filter to one type: `musical`, `literature`, `medley`, `translated`, `album`, `artist`, `performer` |
| `creatorId` | string | IpBaseNumber (e.g. `I-005091277-9`) — returns all works by creator |
| `performerId` | string | Performer number — returns performer info (name in response, but no works — use `getcreatorworks` for that) |

**`primarySearchByTypeKey` values** (from `cache/getcacheddata` → `primarySearchByNameTypeMap`):
| Key | Searches | Name type |
|-----|----------|-----------|
| 1 | Work/song title | W |
| 2 | Creator (composer/author) name | C |
| 3 | Performer name | P |
| 4 | Album name | A |
| 5 | Album catalog number | A |
| 6 | Work number | W |

**`secondarySearchByTypeKey` values** (from `secondarySearchByNameTypeMap`):
| Key | Searches |
|-----|----------|
| 1 | Creator |
| 2 | Performer |
| 3 | Album |
| 4 | Album |
| 5 | Work |

**Response `data` shape:**
```json
{
  "type": "org.acum.site.searchdb.dto.response.SearchDBResponse",
  "resultTypeKeySelected": "",
  "resultTypeInfos": [
    {
      "resultTypeKey": "musical",
      "count": 3748,
      "pageResults": [ WorkBean, ... ]
    },
    {
      "resultTypeKey": "artist",
      "count": 1,
      "pageResults": [ ArtistBean, ... ]
    },
    {
      "resultTypeKey": "performer",
      "count": 1,
      "pageResults": [ PerformerBean, ... ]
    }
  ],
  "personHebName": "",
  "personEngName": ""
}
```

When `creatorId` or `performerId` is passed, `personHebName`/`personEngName` are populated even if `resultTypeInfos` is empty.

---

### 2. `GET /getworkinfo` — Work detail

| Param | Required | Notes |
|-------|----------|-------|
| `workId` | yes | Full work ID (e.g. `1579291`) |
| `versionId` | no | Filter to specific version |
| `pageNumber` | no | Page for version list |
| `resultSortTypeKey` | no | Sort for versions |

**Response `data` shape:**
```json
{
  "type": "org.acum.site.searchdb.dto.response.GetWorkInfoResponse",
  "work": WorkBean,
  "workVersionCount": 1,
  "workVersions": [ WorkBean, ... ]
}
```

---

### 3. `GET /getversioninfo` — Version detail (richer than work)

| Param | Required | Notes |
|-------|----------|-------|
| `workId` | yes | Parent work ID |
| `versionId` | yes | Full version ID (e.g. `1579291001`) |

Returns fuller creator list with `roleCode`, `protectionStatus`, ISWC, ISRC, duration.

**Response `data` shape:**
```json
{
  "type": "org.acum.site.searchdb.dto.response.GetVersionInfoResponse",
  "versionBean": WorkBean (with creators, iswc, isrc, time fields)
}
```

---

### 4. `GET /getcreatorworks` — All works by a creator

| Param | Required | Notes |
|-------|----------|-------|
| `creatorId` | yes | IpBaseNumber (e.g. `I-005091277-9`) |

Returns a list of works authored/composed by this creator.

---

### 5. `GET /gettoptenworks` — Recent/trending works

No params. Returns list of recently registered works.

---

### 6. `GET /cache/getcacheddata` — Static reference data

No params. Returns:
- `primarySearchByNameTypeMap` / `secondarySearchByNameTypeMap` — key→type maps
- `resultTypePriorityMap` — display order
- `creatorRoleTypeDescKeyMap` — role codes: A=Author, C=Composer, CA=Composer+Author, AR=Arranger, AT=Translator, E=Publisher, SE=Sub-publisher, CO=Representing publisher
- `versionEssenceTypeKeyMap` — work category codes
- `albumMediaTypeKeyMap` — album media formats

---

## Bean Shapes

### WorkBean (in search results and work detail)
```json
{
  "fullWorkId": "1579291",
  "work_id": "579291",
  "workNumber": "579291",
  "workLanguage": "1",
  "versionNumber": "",
  "workHebName": "? מה מבקש להירפא הלילה",
  "workEngName": "MA MEVAKESH LEHIRAPE HALAYLA ?",
  "workIsForeign": false,
  "pool": "1",
  "registration_date": "27.01.2026",
  "publication_date": "27.01.2026",
  "workVersions": { "total": "1" },
  "workAlbums": { "total": "0" },
  "authors": [ CreatorBean ],
  "composers": [ CreatorBean ],
  "isWork": "1",
  "isVersion": "0",
  "isMedley": "0",
  "isTranslated": "0",
  "workId": "1579291",
  "workType": "0",
  "rightsPercent": "100"
}
```

When version: also has `performer: PerformerBean`, `creators: [CreatorFullBean]`, `time`, `versionIswcNumber`, `versionIsrcNumber`, `versionEssenceType`, `versionId`.

### CreatorBean (in search results)
```json
{
  "creatorHebName": "נוי אביטל",
  "creatorEngName": "NOY AVITAL",
  "creatorIpBaseNumber": "I-005091277-9",
  "creatorIsZky": true,
  "creatorNameIsForeign": false
}
```

### CreatorFullBean (in version detail)
```json
{
  "number": "00369641425",
  "creatorHebName": "נוי אביטל",
  "creatorEngName": "NOY AVITAL",
  "creatorIpBaseNumber": "I-005091277-9",
  "roleCode": "C",
  "protectionStatus": "1",
  "declareDate": 10226
}
```

### ArtistBean (creator/composer search result)
```json
{
  "number": "I-000151826-7",
  "artistHebName": "שלמה ארצי",
  "artistEngName": "SHLOMO ARTZI",
  "artistWorkCount": "396",
  "artistVersionCount": "114",
  "artistType": "001",
  "artistSex": "ז",
  "artistProfession": "קמ",
  "artistMemberType": "1",
  "artistJoinYear": "1972",
  "artistMainIp": {
    "artistIpnNumber": "00064925460",
    "artistCaeNumber": "649254",
    "artistCaeQuality": "PA",
    "artistCaeName": "SHLOMO ARTZI"
  }
}
```

`artistProfession` codes: `ק`=composer, `מ`=author/lyricist, `קמ`=both, `מול`=publisher.

### PerformerBean (performer search result)
```json
{
  "number": "66165",
  "performerHebName": "ארצי שלמה חנוך שלום",
  "performerEngName": "ARTZI SHLOMO/HANOCH SHALOM",
  "performerNameIsForeign": false
}
```

---

## Work ID Scheme

- `fullWorkId` = complete numeric ID used in all API calls (e.g. `1579291`)
- `workNumber` = 6-digit suffix without the leading `1` (e.g. `579291`) — display/legacy
- Version IDs append a zero-padded 3-digit counter: `1579291001`, `1579291002`, etc.
- `isWork="1"` = master work record; `isVersion="1"` = specific version

---

## Work Types

| `workType` / `isX` flags | Meaning |
|---|---|
| `isWork=1` | Master work |
| `isVersion=1` | Version of a work |
| `isMedley=1` | Medley |
| `isTranslated=1` | Translated version |

Result type categories: `musical`, `literature`, `medley`, `translated`, `album`, `artist`, `performer`

Pool: `1`=Local (Israeli), `2`=Foreign

---

## Pagination

Default page size: 10 (musical/literature), 9 (album/artist/performer). Extended ("mole") mode: up to 30.  
Page is 1-based via `pageNumber` param.

---

## What Does NOT Work as Documented

- `GET /work?workid=` — returns the AngularJS HTML shell, **not JSON**. Use `/getworkinfo?workId=` instead.
- `GET /results?performerid=` — same, returns HTML shell. Use `/searchdb?performerId=` or `/getcreatorworks`.
- `searchnames` endpoint — returns error 2 (missing params) with the params tested; likely requires additional undocumented params. Skip for now; `/searchdb` covers all search needs.

---

## Confirmed Unauthenticated Endpoints (safe to wrap)

| Endpoint | Purpose |
|----------|---------|
| `GET /searchdb` | Search everything |
| `GET /getworkinfo` | Work + versions list |
| `GET /getversioninfo` | Version detail with ISWC/ISRC |
| `GET /getcreatorworks` | All works by creator IpBaseNumber |
| `GET /gettoptenworks` | Recent/trending works |
| `GET /cache/getcacheddata` | Static reference maps |
