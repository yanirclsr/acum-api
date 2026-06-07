import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import { apiRateLimit } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errors";
import searchRouter from "./routes/search";
import worksRouter from "./routes/works";
import artistsRouter from "./routes/artists";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Security + attribution headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Unofficial-Notice", "Not affiliated with ACUM. Wraps public unauthenticated endpoints only.");
  next();
});

// OpenAPI docs
const openapiPath = path.resolve(__dirname, "../../../docs/openapi.yaml");
if (fs.existsSync(openapiPath)) {
  const spec = yaml.load(fs.readFileSync(openapiPath, "utf8")) as Record<string, unknown>;
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
}

// Health check (no rate limit)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "acum-api" });
});

// API routes with rate limiting
app.use("/api", apiRateLimit);
app.use("/api/search", searchRouter);
app.use("/api/works", worksRouter);
app.use("/api/artists", artistsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`acum-api listening on port ${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/docs`);
});

export default app;
