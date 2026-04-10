import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(packageDir, "../..");
const entryPoint = path.join(packageDir, "src/index.ts");
const distOutfile = path.join(packageDir, "dist/index.mjs");
const skillOutfile = path.join(
  projectRoot,
  "skills/instagram-insights/bin/instagram-insights.mjs",
);

const sharedOptions = {
  entryPoints: [entryPoint],
  bundle: true,
  external: ["commander", "commander-ts", "reflect-metadata"],
  format: "esm",
  platform: "node",
  target: "node20",
  sourcemap: false,
  logLevel: "info",
  banner: {
    js: "#!/usr/bin/env node",
  },
};

await mkdir(path.dirname(distOutfile), { recursive: true });
await mkdir(path.dirname(skillOutfile), { recursive: true });

await Promise.all([
  build({
    ...sharedOptions,
    outfile: distOutfile,
  }),
  build({
    ...sharedOptions,
    outfile: skillOutfile,
  }),
]);
