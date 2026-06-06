# acum-api

> ⚠️ **לא רשמי — אינו קשור או מאושר על ידי ACUM (אקו"ם) בשום צורה שהיא.**
> זהו פרויקט קוד פתוח עצמאי. הוא מבצע הנדסה הפוכה ועוטף את נקודות הקצה הציבוריות הלא מאומתות לחיפוש בכתובת [nocs.acum.org.il](https://nocs.acum.org.il/acumsitesearchdb/).
> כל הנתונים שייכים ל-ACUM. השתמש באחריות.

---

## כתב ויתור

לפרויקט זה **אין קשר רשמי עם ACUM (אקו"ם)**. הוא אינו:
- מורשה, מאושר או נתמך על ידי ACUM
- API או SDK רשמי המסופק על ידי ACUM
- קשור למוצר או שירות כלשהו של ACUM

הוא פועל באמצעות קריאה לאותן נקודות קצה (HTTP endpoints) ציבוריות ולא מאומתות המפעילות את אתר החיפוש הציבורי של ACUM. אין ממשקי API פרטיים, אין עקיפת אימות, אין נתונים שנצברו ("scraped") – רק מה שהאתר עצמו משרת לכל מבקר.

אם אתה משתמש בזה בסביבת ייצור (production), ודא שמקרה השימוש שלך עומד בתנאי השימוש של ACUM ([terms of service](https://www.acum.org.il/)).

---

## מה זה?

ACUM היא אגודת זכויות המוזיקה של ישראל, המנהלת זכויות עבור למעלה מ-1.7 מיליון יצירות. למאגר החיפוש הציבורי שלהם אין API מתועד. רפוזיטורי זה מספק:

- **`packages/acum-client`** — קליינט TypeScript מטיפוסים מוגדרים (typed) ללא תלות כלשהי (ללא Express) שתוכלו לייבא לכל פרויקט Node.js או MCP server
- **`packages/api`** — Express REST API מוכן לייצור (production-ready) העוטף את הקליינט

---

## התחלה מהירה

### Docker (מומלץ)

```bash
docker compose up
```

ה-API זמין בכתובת `http://localhost:3000`. התיעוד בכתובת `http://localhost:3000/docs`.

### פיתוח מקומי

```bash
node --version  # requires Node 20+
npm install
npm run build
npm run dev --workspace=packages/api
```

---

## תיעוד API

תיעוד אינטראקטיבי מלא בכתובת `/docs` (Swagger UI).

### חיפוש יצירות

```
GET /api/search?q=לילה&by=title&method=partial&page=1&limit=10
```

| פרמטר | ערכים | ברירת מחדל |
|-------|--------|---------|
| `q` | כל טקסט | חובה |
| `by` | `title`, `composer`, `performer`, `album`, `catalog`, `number` | `title` |
| `artist` | פילטר משני אופציונלי למבצע | — |
| `method` | `partial`, `exact` | `partial` |
| `sort` | `alphabetical`, `reverse` | `alphabetical` |
| `page` | מספר שלם ≥ 1 | `1` |
| `limit` | 1–30 | `10` |
| `type` | `works`, `artists` | `works` |

### קבל פרטי יצירה

```
GET /api/works/1579291
GET /api/works/1579291/versions/1579291001
```

### חיפוש אמנים

```
GET /api/artists/search?q=שלמה+ארצי
```

### יצירות אמן

```
GET /api/artists/I-000151826-7/works
```

### בדיקת תקינות

```
GET /health
```

---

## הפעלה ב-Postman

ייבא את `postman/acum-api.postman_collection.json` מרפוזיטורי זה.

---

## שימוש ישיר בחבילת הקליינט

```ts
import { createHttpClient, searchWorks, getWork } from "@acum-api/acum-client";

const http = createHttpClient();

const results = await searchWorks(http, { q: "לילה", by: "title" });
console.log(results.total, results.results[0].titleHebrew);

const work = await getWork(http, "1579291");
console.log(work.iswc, work.versions.length);
```

לקליינט אין תלות ב-Express — תוכל לשלב אותו בכל פרויקט Node.js או MCP server.

---

## הגבלת קצב (Rate limiting)

60 requests/minute/IP. אנא כבד את שרתי ACUM.

---

## שפות

- English: [README.md](README.md)
- עברית: [README.he.md](README.he.md)

כדי ליצור מחדש את התרגום לעברית לאחר עריכת `README.md`:
```bash
npm run translate
```
דורש `GEMINI_API_KEY` בקובץ `.env`.

## תרומה

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

## רישיון

MIT — ראה [LICENSE](LICENSE).