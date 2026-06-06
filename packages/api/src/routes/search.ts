import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { searchWorks, searchArtists, createHttpClient } from "@acum-api/acum-client";

const router = Router();
const http = createHttpClient();

const SearchSchema = z.object({
  q: z.string().min(1).max(200),
  by: z
    .enum(["title", "artist", "composer", "performer", "album", "catalog", "number"])
    .default("title"),
  artist: z.string().max(200).optional(),
  method: z.enum(["partial", "exact"]).default("partial"),
  sort: z.enum(["alphabetical", "reverse"]).default("alphabetical"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
  type: z.enum(["works", "artists"]).default("works"),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = SearchSchema.parse(req.query);

    if (params.type === "artists") {
      const result = await searchArtists(http, {
        q: params.q,
        by: params.by,
        method: params.method,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      });
      res.json(result);
      return;
    }

    const result = await searchWorks(http, {
      q: params.q,
      by: params.by,
      secondaryQ: params.artist,
      secondaryBy: params.artist ? "performer" : undefined,
      method: params.method,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
