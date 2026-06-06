import { Request, Response, NextFunction } from "express";
import { AcumError } from "@acum-api/acum-client";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid parameters",
      details: err.errors.map(e => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }

  if (err instanceof AcumError) {
    const status = err.code === 4 ? 404 : err.code === 2 ? 400 : 502;
    res.status(status).json({
      error: "Upstream ACUM error",
      code: err.code,
      description: err.description,
    });
    return;
  }

  const isAxiosError =
    typeof err === "object" && err !== null && "isAxiosError" in err;
  if (isAxiosError) {
    res.status(502).json({ error: "ACUM service unreachable" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
