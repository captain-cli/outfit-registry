import test from "node:test";
import assert from "node:assert/strict";

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

function sha256(buffer) {
  return createHash("sha256")
    .update(buffer)
    .digest("hex");
}

test("registry digest matches release manifest", async () => {
  const registryPath = resolve(
    process.cwd(),
    "registry.json"
  );

  const releasePath = resolve(
    process.cwd(),
    "registry.release.json"
  );

  const registry = await readFile(registryPath);

  const release = JSON.parse(
    await readFile(releasePath, "utf8")
  );

  assert.equal(
    release.digest.algorithm,
    "sha256"
  );

  assert.equal(
    sha256(registry),
    release.digest.value
  );
});

test("modified registry fails digest validation", async () => {
  const registryPath = resolve(
    process.cwd(),
    "registry.json"
  );

  const releasePath = resolve(
    process.cwd(),
    "registry.release.json"
  );

  const registry = await readFile(registryPath);

  const release = JSON.parse(
    await readFile(releasePath, "utf8")
  );

  const tamperedRegistry = Buffer.from(registry);

  // Flip one byte without touching the real registry file.
  tamperedRegistry[0] =
    tamperedRegistry[0] === 0x7b ? 0x5b : 0x7b;

  assert.notEqual(
    sha256(tamperedRegistry),
    release.digest.value
  );
});
