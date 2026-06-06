#!/usr/bin/env node
/**
 * Translates README.md to Hebrew using the Gemini API.
 * Output: README.he.md
 *
 * Usage: node scripts/translate-readme.mjs
 * Requires: GEMINI_API_KEY in .env or environment
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load .env manually (avoid adding dotenv as a dep to scripts)
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length && !process.env[k.trim()]) {
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error("Error: GEMINI_API_KEY not set in .env or environment.");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

const readme = readFileSync(resolve(root, "README.md"), "utf8");

const prompt = `Translate the following README.md file to Hebrew (RTL). Rules:
- Keep all code blocks, URLs, file paths, command names, and technical terms in English exactly as-is
- Keep all markdown formatting (headers with #, bullets, code fences, tables) intact
- Translate all prose, descriptions, heading text, and explanations to natural Hebrew
- Keep the same structure and section order
- Output ONLY the translated markdown, no preamble or explanation

README to translate:

${readme}`;

console.log(`Translating README.md → README.he.md via ${MODEL}...`);

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
});

if (!response.ok) {
  const err = await response.text();
  console.error("Gemini API error:", err);
  process.exit(1);
}

const data = await response.json();
const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!translated) {
  console.error("Unexpected response shape:", JSON.stringify(data, null, 2));
  process.exit(1);
}

writeFileSync(resolve(root, "README.he.md"), translated, "utf8");
console.log("Done. README.he.md updated.");
