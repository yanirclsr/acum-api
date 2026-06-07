# acum-api

> ⚠️ **לא רשמי — אינו משויך או מאושר על ידי אקו"ם בשום צורה שהיא.**
> זהו פרויקט קוד פתוח עצמאי. הוא עושה הנדסה הפוכה ועוטף את נקודות הקצה הציבוריות הלא מאומתות לחיפוש ב- [nocs.acum.org.il](https://nocs.acum.org.il/acumsitesearchdb/).
> כל הנתונים שייכים לאקו"ם. השתמשו באחריות.

---

## הצהרת אחריות

לפרויקט זה **אין קשר רשמי עם אקו"ם**. הוא אינו:
- מורשה, מאושר או נתמך על ידי אקו"ם
- API או SDK רשמי המסופק על ידי אקו"ם
- משויך למוצר או שירות כלשהו של אקו"ם

הוא פועל על ידי קריאה לאותן נקודות קצה HTTP לא מאומתות המפעילות את אתר החיפוש הציבורי של אקו"ם. אין APIs פרטיים, אין עקיפת אימות, אין נתונים מגורדים – רק מה שהאתר עצמו מגיש לכל מבקר.

אם אתם משתמשים בזה בפרודקשן, ודאו כי מקרה השימוש שלכם מכבד את [תנאי השירות](https://www.acum.org.il/) של אקו"ם.

---

## מה זה?

אקו"ם היא אגודת זכויות המוזיקה של ישראל, המנהלת זכויות עבור למעלה מ-1.7 מיליון יצירות. למאגר החיפוש הציבורי שלהם אין API מתועד. ריפו זה מספק:

- **`packages/acum-client`** — קליינט TypeScript מטיפוסים (typed TypeScript client) ללא תלות (Express-free) שניתן לייבא לכל פרויקט Node.js או שרת MCP
- **`packages/api`** — REST API מוכן לפרודקשן מבוסס Express שעוטף את הקליינט
- **`packages/mcp`** — שרת MCP עבור Claude Desktop ועוזרי AI אחרים התואמים ל-MCP

---

## התקנה

### שרת MCP (Claude Desktop / עוזרי AI)

**Homebrew (מומלץ)**

```bash
brew tap yanirclsr/tap
brew install acum-mcp
```

**npm**

```bash
npm install -g @acum-api/mcp
```

לאחר מכן הוסיפו לקובץ `claude_desktop_config.json` של Claude Desktop:

```json
{
  "mcpServers": {
    "acum": {
      "command": "acum-mcp"
    }
  }
}
```

הפעילו מחדש את Claude Desktop. כעת תוכלו לבקש מקלוד לחפש באקו"ם ישירות.

### REST API

**Docker (מומלץ)**

```bash
docker compose up
```

ה-API זמין ב-`http://localhost:3000`. התיעוד זמין ב-`http://localhost:3000/docs`.

**פיתוח מקומי**

```bash
node --version  # requires Node 20+
npm install
npm run build
npm run dev --workspace=packages/api
```

---

## כלי MCP

שרת ה-MCP חושף 5 כלים:

| Tool | Description |
|------|-------------|
| `search_works` | חיפוש לפי כותרת, מלחין, מבצע, אלבום, או מספר יצירה |
| `get_work` | פרטי יצירה מלאים + כל הגרסאות |
| `get_version` | פרטים עבור גרסה ספציפית |
| `search_artists` | מציאת מלחינים/יוצרים לפי שם |
| `get_artist_works` | כל היצירות הרשומות ליוצר |

---

## תיעוד ה-REST API

תיעוד אינטראקטיבי מלא ב-`/docs` (Swagger UI).

### חיפוש יצירות

```
GET /api/search?q=לילה&by=title&method=partial&page=1&limit=10
```

| Param | Values | Default |
|-------|--------|---------|
| `q` | כל טקסט | נדרש |
| `by` | `title`, `composer`, `performer`, `album`, `catalog`, `number` | `title` |
| `artist` | פילטר משני אופציונלי למבצע | — |
| `method` | `partial`, `exact` | `partial` |
| `sort` | `alphabetical`, `reverse` | `alphabetical` |
| `page` | מספר שלם ≥ 1 | `1` |
| `limit` | 1–30 | `10` |
| `type` | `works`, `artists` | `works` |

### קבלת פרטי יצירה

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

ייבאו את `postman/acum-api.postman_collection.json` מריפו זה.

---

## שימוש ישיר בחבילת הקליינט

```bash
npm install @acum-api/acum-client
```

```ts
import { createHttpClient, searchWorks, getWork } from "@acum-api/acum-client";

const http = createHttpClient();

const results = await searchWorks(http, { q: "לילה", by: "title" });
console.log(results.total, results.results[0].titleHebrew);

const work = await getWork(http, "1579291");
console.log(work.iswc, work.versions.length);
```

ללא תלות ב-Express — שלבו אותו בכל פרויקט Node.js או שרת MCP.

---

## הגבלת קצב בקשות (Rate limiting)

60 בקשות/דקה/IP. כבדו את שרתי אקו"ם.

---

## שפות

- English: [README.md](README.md)
- עברית: [README.he.md](README.he.md)

כדי ליצור מחדש את התרגום העברי לאחר עריכת `README.md`:
```bash
npm run translate
```
דורש `GEMINI_API_KEY` בקובץ `.env`.

## תרומה

ראו [CONTRIBUTING.md](CONTRIBUTING.md).

## רישיון

MIT — ראו [LICENSE](LICENSE).
