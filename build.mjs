// Frontend build for ai-terminology.com
//
// Two jobs:
//   1. Pre-compile JSX → JS so the browser doesn't have to ship + run Babel.
//      (Babel-in-browser was 3 MB. Pre-compiling makes that overhead disappear.)
//   2. Convert mascot PNGs to WebP for ~10× compression at similar quality.
//      (Original PNGs total ~14 MB; WebP is typically 1-2 MB at q80.)
//
// Outputs are committed alongside sources so Cloudflare Pages doesn't need to
// run this on deploy. Re-run locally when you change a JSX or PNG source:
//
//   npm install        # one-time
//   npm run build      # both jobs
//   npm run build:jsx  # JSX only (faster)
//   npm run build:images   # WebP only

import { build as esbuildBuild } from "esbuild";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const onlyJsx = args.has("--jsx-only");
const onlyImages = args.has("--images-only");

if (!onlyImages) await buildJsx();
if (!onlyJsx) await buildImages();

async function buildJsx() {
  console.log("\n=== JSX → JS ===");
  const dir = "variations";
  const sources = (await fs.readdir(dir)).filter(f => f.endsWith(".jsx"));
  for (const src of sources) {
    const out = src.replace(/\.jsx$/, ".js");
    const inPath = path.join(dir, src);
    const outPath = path.join(dir, out);
    await esbuildBuild({
      entryPoints: [inPath],
      outfile: outPath,
      bundle: false,
      loader: { ".jsx": "jsx" },
      jsx: "transform",
      // The pages already load React globally via UMD; transform JSX to
      // React.createElement calls that consume that global. No imports needed.
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      target: "es2020",
      format: "iife",
      minify: true,
      legalComments: "none",
      logLevel: "warning"
    });
    const before = (await fs.stat(inPath)).size;
    const after = (await fs.stat(outPath)).size;
    console.log(`  ${src.padEnd(20)} ${kb(before)} → ${kb(after)}  (${out})`);
  }
}

async function buildImages() {
  console.log("\n=== PNG → WebP ===");
  const dir = "assets";
  const pngs = (await fs.readdir(dir)).filter(f => f.endsWith(".png") && f.startsWith("lexi-"));
  let totalBefore = 0;
  let totalAfter = 0;
  for (const png of pngs) {
    const inPath = path.join(dir, png);
    const outPath = inPath.replace(/\.png$/, ".webp");
    // q=82 hits a sweet spot for these illustrated PNGs — no perceptible
    // quality loss vs source, ~10× smaller. Lossy is fine here (illustrations
    // with smooth gradients, not pixel-precise screenshots).
    await sharp(inPath).webp({ quality: 82, effort: 5 }).toFile(outPath);
    const before = (await fs.stat(inPath)).size;
    const after = (await fs.stat(outPath)).size;
    totalBefore += before;
    totalAfter += after;
    console.log(`  ${png.padEnd(28)} ${kb(before).padStart(8)} → ${kb(after).padStart(8)}  (${pct(after / before)})`);
  }
  console.log(`  ${"TOTAL".padEnd(28)} ${kb(totalBefore).padStart(8)} → ${kb(totalAfter).padStart(8)}  (${pct(totalAfter / totalBefore)})`);
}

function kb(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function pct(ratio) {
  return `${(ratio * 100).toFixed(0)}% of original`;
}
