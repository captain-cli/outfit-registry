# Captain Outfit Registry

<p align="center">
  <img src="./assets/outfit-registry-banner.png" alt="Captain Outfit Registry — Every cargo manifest must be trusted" width="100%" />
</p>

**Every cargo manifest must be trusted.**

Captain Outfit Registry is the **signed catalog of dependency identities, platform mappings, and authorized package sources** used by [Captain Outfit](https://github.com/captain-cli/outfit).

> **In one sentence:** Applications declare *what they need*; the Registry identifies *which native package and source are trusted*; Outfit decides *whether an approved installation may proceed*.

**Status:** Active development. The demonstrated trusted integration path uses Ubuntu and APT. Other platforms and package managers are not yet claimed as fully supported.

## How it works

```text
Application: "utility.sl"
        ↓
Signed registry + trusted host key
        ↓
Canonical identity: utility.sl
        ↓
Ubuntu / APT → package: sl → source: ubuntu.official
        ↓
Outfit plan → review → approve → apply → verify → receipt
```

Think of Outfit as the crew loading a ship. The Registry is the **authorized cargo manifest**: it identifies what each container is, where it may come from, and whether the manifest itself is authentic.

## Quick start: verify the registry safely

**Prerequisite:** Node.js. The commands below run local tests and **do not install OS packages, generate keys, or modify signed releases**.

```bash
git clone https://github.com/captain-cli/outfit-registry.git
cd outfit-registry
node --test tests/*.test.mjs
```

The test suite checks registry digests, modified-content detection, Ed25519 signatures, tampered releases, verification against a tracked public key, and deterministic signing payloads.

For the companion installation-planning CLI, see [Captain Outfit](https://github.com/captain-cli/outfit). Cloning this repository alone does **not** configure a host to trust its signing keys.

## Your first dependency mapping

An application requests a **logical identity**, not an operating-system command:

```json
{
  "requires": ["utility.sl"]
}
```

The registry can define its authorized implementation:

```json
{
  "id": "utility.sl",
  "mappings": [
    {
      "platform": "ubuntu",
      "packageManager": "apt",
      "package": "sl",
      "source": "ubuntu.official"
    }
  ]
}
```

This is an illustrative dependency entry; the complete catalog and its source declarations live in [`registry.json`](./registry.json). The actual data must conform to [`schemas/registry.schema.json`](./schemas/registry.schema.json).

**The application cannot replace `utility.sl` with an arbitrary `sudo apt install` command.** The registry controls dependency identity, platform implementation, and source authorization.

## What's in this repository?

| Path | Purpose |
| --- | --- |
| [`registry.json`](./registry.json) | Canonical dependencies, platform mappings, and sources |
| [`registry.release.json`](./registry.release.json) | Digest and signed release metadata |
| [`schemas/registry.schema.json`](./schemas/registry.schema.json) | Registry data contract |
| [`trust/`](./trust/) | Public verification keys; **not** private signing keys |
| [`docs/TRUST_MODEL.md`](./docs/TRUST_MODEL.md) | Detailed trust and security architecture |
| [`scripts/`](./scripts/) | Key generation, release generation, and signing tools |
| [`tests/`](./tests/) | Integrity, signature, and signing-payload tests |

## Trust model

The Registry is security-sensitive because changing a mapping changes which native package Outfit might install with elevated privileges.

```text
registry.json ── SHA-256 digest ──┐
                                  ├── registry.release.json
Release metadata ── Ed25519 ─────┘             │
                                               ▼
                                  Host-installed trusted public key
                                               │
                                               ▼
                                      Trusted resolution
```

The host, **not the registry directory**, establishes the root of trust. Outfit uses trusted signing keys installed under `/etc/captain/outfit/trust/` to verify releases. Merely pointing Outfit at a directory does not make it trustworthy.

Verification is designed to **fail closed** for missing or invalid signatures, mismatched digests, unknown or untrusted keys, unknown dependency identities, missing platform mappings, and unauthorized source combinations.

For a full explanation of trust boundaries, key identities, and verification, read [`docs/TRUST_MODEL.md`](./docs/TRUST_MODEL.md).

## How releases are made

The repository includes tooling to regenerate metadata and sign a release:

```bash
node scripts/generate-release.mjs
node scripts/sign-release.mjs
```

**Maintainer workflow only:** These commands are **not** part of the safe Quick Start. They may update tracked release metadata and require appropriately protected signing credentials. Review their implementation and key handling before running them. Never commit private keys, secrets, or signing credentials.

A release binds the exact registry bytes to their SHA-256 digest and authenticates the release metadata with Ed25519. Integrity alone is insufficient: a digest is not proof that a change was authorized.

### Proposing a new dependency

1. Propose a stable, descriptive logical identity and explain the capability it represents.
2. Identify the supported platform, native package manager, native package, and authorized source.
3. Validate the data against the schema and run the test suite.
4. Submit the proposed mapping for maintainer review.
5. **Do not** treat a proposed mapping as trusted until an authorized maintainer has produced a signed release and the consuming host trusts its signing key.

A mapping change is not a signing authorization. Registry contributors should not need access to private signing keys.

## Why approval remains necessary

A valid signed registry answers **what may satisfy a requirement**. It does **not** automatically authorize installing that package on a particular host.

[Outfit](https://github.com/captain-cli/outfit) separately resolves the trusted dependency, previews the native transaction, fingerprints the effective plan, requests explicit approval, revalidates before execution, verifies the resulting state, and writes a receipt.

If a mapping changes after approval, the original approval does **not** authorize the new resolution. Outfit must produce a new plan and receive new approval.

## Current scope

The repository establishes the signed-registry trust path demonstrated with Outfit's Ubuntu/APT backend. Canonical dependency identities are designed to support additional platforms over time, but a conceptual mapping is not a claim of production-ready execution support.

## Captain ecosystem

**[Outfit Registry](https://github.com/captain-cli/outfit-registry)** identifies and authenticates approved dependency mappings. **[Outfit](https://github.com/captain-cli/outfit)** plans, approves, and executes authorized host dependency operations. They intentionally remain separate.

**One registry. Verified content. Trusted dependencies.**
