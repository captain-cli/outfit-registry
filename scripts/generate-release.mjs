import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(process.cwd());

const registryPath = resolve(root, "registry.json");
const releasePath = resolve(root, "registry.release.json");

const registry = await readFile(registryPath);

const digest = createHash("sha256")
  .update(registry)
  .digest("hex");

const release = JSON.parse(
  await readFile(releasePath, "utf8")
);

release.digest = {
  algorithm: "sha256",
  value: digest
};

await writeFile(
  releasePath,
  `${JSON.stringify(release, null, 2)}\n`,
  "utf8"
);

console.log(`Registry SHA-256: ${digest}`);
console.log(`Updated: ${releasePath}`);
