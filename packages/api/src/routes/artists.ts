import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { searchArtists, getCreatorWorks, createHttpClient } from "@acum-api/acum-client";

const router = Router();
const http = createHttpClient();

const ArtistSearchSchema = z.object({
  q: z.string().min(1).max(200),
  method: z.enum(["partial", "exact"]).default("partial"),
  sort: z.enum(["alphabetical", "reverse"]).default("alphabetical"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

const ArtistIdSchema = z.object({
  id: z.string().min(5).max(50),
});

const ArtistWorksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["alphabetical", "reverse"]).default("alphabetical"),
});

router.get("/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = ArtistSearchSchema.parse(req.query);
    const result = await searchArtists(http, {
      q: params.q,
      by: "artist",
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

router.get("/:id/works", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ArtistIdSchema.parse(req.params);
    const query = ArtistWorksQuerySchema.parse(req.query);
    const result = await getCreatorWorks(http, {
      creatorIpBaseNumber: id,
      page: query.page,
      sort: query.sort,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
