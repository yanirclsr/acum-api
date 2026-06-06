import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getWork, getVersion, createHttpClient } from "@acum-api/acum-client";

const router = Router();
const http = createHttpClient();

const WorkIdSchema = z.object({
  id: z.string().regex(/^\d{7,10}$/, "Work ID must be 7-10 digits"),
});

const VersionIdSchema = z.object({
  versionId: z.string().regex(/^\d{10,13}$/, "Version ID must be 10-13 digits"),
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = WorkIdSchema.parse(req.params);
    const work = await getWork(http, id);
    res.json(work);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/versions/:versionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = WorkIdSchema.parse(req.params);
    const { versionId } = VersionIdSchema.parse(req.params);
    const version = await getVersion(http, id, versionId);
    res.json(version);
  } catch (err) {
    next(err);
  }
});

export default router;
