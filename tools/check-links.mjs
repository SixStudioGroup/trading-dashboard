#!/usr/bin/env node
// Checks that every internal link and asset in the site's pages points at a file that exists.
import { readdirSync, existsSync, readFileSync } from "node:fs";

const pages = readdirSync(".").filter((f) => f.endsWith(".html"));
const broken = [];
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    if (/^(https?:|mailto:|data:|\/\/)/.test(url)) continue;
    if (!existsSync(url)) broken.push(`${page}: ${url}`);
  }
}
if (broken.length) {
  console.error(`Broken links:\n${broken.join("\n")}`);
  process.exit(1);
}
console.log(`link check: ${pages.length} pages ok`);
