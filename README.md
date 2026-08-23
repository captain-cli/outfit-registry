# Captain Outfit Registry
<p align="center">
    <img src="./assets/captain-outfit-registry.png" alt="Captain - Captain's Outfit Registry" width="100%" />
</p>
> Signed dependency identities and trusted platform mappings for Captain Outfit.

Captain Outfit Registry is the trust and resolution layer behind **Captain Outfit**.

It defines the relationship between a logical dependency requested by an application and the native package that is authorized to satisfy that requirement on a particular platform.

The core principle is simple:

**Applications declare capabilities. The registry defines trusted implementations.**

```text
Application
    │
    │ requires
    ▼
"utility.sl"
    │
    ▼
┌─────────────────────────────┐
│   Captain Outfit Registry   │
│                             │
│   Identity                  │
│   Platform Mapping          │
│   Package Manager           │
│   Package                   │
│   Authorized Source         │
└──────────────┬──────────────┘
               │
               ▼
        Ubuntu + APT
               │
               ▼
              sl
               │
               ▼
       ubuntu.official
```

The application never needs to know that the native package is named `sl`, that APT provides it, or which source is authorized to supply it.

Those decisions belong to the trusted registry.

---

# Why a Registry?

A traditional application dependency declaration might eventually become something like:

```bash
sudo apt install sl
```

That creates a direct relationship between application-controlled configuration and privileged package installation.

Captain deliberately breaks that relationship.

Instead, an application declares:

```json
{
  "requires": [
    "utility.sl"
  ]
}
```

The registry determines whether that dependency exists and how it may be resolved.

For example:

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

This separates:

```text
APPLICATION INTENT
        │
        ▼
DEPENDENCY IDENTITY
        │
        ▼
PLATFORM IMPLEMENTATION
        │
        ▼
AUTHORIZED SOURCE
```

The application controls the first.

The trusted registry controls the rest.

---

# Registry Responsibilities

Captain Outfit Registry provides four primary guarantees.

## Identity

Dependencies receive stable canonical identities.

```text
utility.sl
```

An identity represents a logical dependency independently of the package name used by any individual operating system.

Aliases may resolve to canonical identities, but resolution ultimately produces a known registry dependency.

Unknown dependencies are rejected.

## Platform Mapping

A canonical dependency may have different implementations on different platforms.

Conceptually:

```text
dependency.foo
      │
      ├── Ubuntu / apt  → foo
      ├── Fedora / dnf  → foo
      └── future OS     → another-package
```

The application does not need platform-specific installation logic.

That knowledge belongs to the registry.

## Source Authorization

Package mappings reference registered sources.

A source is not implicitly trusted simply because a package manager can reach it.

Mappings determine which source is authorized for a particular dependency and environment.

Outfit rejects mappings attempting to use a source outside its authorized platform or package-manager constraints.

## Release Authenticity

Registry contents are distributed with cryptographically protected release metadata.

A registry release must pass both integrity and authenticity verification before Outfit trusts its mappings.

---

# Trust Model

The registry is treated as security-sensitive configuration.

Changing:

```text
utility.foo → package A
```

to:

```text
utility.foo → package B
```

changes what privileged software Outfit may install.

Registry modification is therefore not treated as ordinary configuration drift.

Captain protects registry releases through:

```text
registry.json
     │
     │ SHA-256
     ▼
registry.release.json
     │
     │ Ed25519 signature
     ▼
Trusted Signing Key
     │
     ▼
Host Trust Anchor
```

The host establishes the root of trust.

The registry does not establish trust in itself.

---

# Signed Releases

The repository contains release tooling for generating and signing registry metadata.

Generate release metadata:

```bash
node scripts/generate-release.mjs
```

This calculates the SHA-256 digest of the registry and updates:

```text
registry.release.json
```

Sign the release:

```bash
node scripts/sign-release.mjs
```

The release metadata is signed using Ed25519.

A valid release therefore proves two separate properties:

```text
SHA-256
   │
   └── Is this exactly the registry content
       described by the release?

Ed25519
   │
   └── Was this release authorized by a
       trusted signing key?
```

Both checks matter.

Integrity without authenticity would allow an attacker to replace both the registry and its digest.

Authenticity without content verification would fail to bind the signature to the exact registry being consumed.

---

# Host Trust

Captain Outfit maintains trusted registry signing keys on the host.

The current trust location is:

```text
/etc/captain/outfit/trust/
```

For example:

```text
/etc/captain/outfit/trust/captain.registry.root.v1.pem
```

The trust relationship therefore looks like:

```text
HOST
 │
 └── trusts
      │
      ▼
captain.registry.root.v1
      │
      └── verifies
           │
           ▼
     registry release
           │
           └── authenticates
                │
                ▼
           registry.json
```

Supplying a registry directory to Outfit does **not** make that registry trusted.

The release must chain back to key material already trusted by the host.

---

# Failure Is the Default

Registry validation is intentionally fail-closed.

Outfit rejects a registry when it encounters conditions such as:

```text
Modified registry content
Missing release metadata
Unsupported digest algorithm
Missing release signature
Unknown signing-key ID
Invalid signing-key ID
Untrusted signing-key material
Modified signed release metadata
Unknown dependency
Missing platform mapping
Unauthorized source/platform combination
Unauthorized source/package-manager combination
```

Resolution succeeds only after the required trust relationships have been established.

---

# Dependency Resolution

Given a request:

```text
utility.sl
```

and a host:

```text
Platform:        ubuntu
Package Manager: apt
```

the registry can resolve:

```text
Requirement:      utility.sl
Canonical ID:     utility.sl
Platform:         ubuntu
Package Manager:  apt
Package:          sl
Source:           ubuntu.official
Registry Version: 0.1.0-dev.0
```

That resolution becomes part of Outfit's installation plan.

The plan is subsequently fingerprinted and explicitly approved.

Changing the registry mapping after approval therefore changes the reconstructed plan and causes Outfit to reject the operation.

```text
REGISTRY
   │
   ▼
RESOLUTION
   │
   ▼
PLAN
   │
   ▼
FINGERPRINT
   │
   ▼
APPROVAL
```

This binds registry resolution to the trusted apply lifecycle rather than treating dependency resolution as an unrelated lookup.

---

# Registry Changes After Approval

Consider an approved mapping:

```text
utility.foo
    ↓
package: foo
source: ubuntu.official
```

If the registry later changes it to:

```text
utility.foo
    ↓
package: foo-ng
source: another.source
```

the existing approval does **not** authorize the new mapping.

Outfit reconstructs the current plan and compares it with the approved state.

The operation is rejected.

The user must generate and approve a new plan.

This is an important distinction:

> **Approval follows the resolved dependency state, not merely the dependency name.**

---

# Registry Structure

The registry currently contains dependency definitions and their platform-specific mappings.

A dependency resembles:

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

Mappings associate a canonical dependency with:

```text
platform
package manager
native package
authorized source
```

The registry also maintains the source information required to determine whether a mapping is permitted for a particular environment.

---

# Canonical Dependencies

Canonical dependency IDs deliberately separate application requirements from native package naming.

Instead of embedding:

```text
apt:sl
dnf:some-package
pacman:another-package
```

into application manifests, Captain applications can depend on stable identities:

```text
utility.sl
database.postgresql
runtime.node
media.ffmpeg
```

As additional platforms are introduced, the canonical identity can remain stable while its mappings evolve.

```text
                  dependency.foo
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
          Ubuntu      Fedora     Future OS
             │          │          │
            apt        dnf        ...
             │          │          │
          package A  package B  package C
```

This gives the Captain ecosystem a dependency vocabulary independent of any single operating system.

---

# Security Boundaries

The registry is deliberately constrained.

### A dependency must exist

Arbitrary package names are not equivalent to registered dependencies.

### A mapping must exist for the host

A valid dependency on one platform does not imply authorization on another.

### A source must be registered

Dependency mappings cannot introduce arbitrary package sources.

### A source must be authorized for the environment

Platform and package-manager restrictions are enforced.

### Registry contents must match their release metadata

Modified content fails SHA-256 verification.

### Release metadata must be signed

Unsigned or improperly signed releases are rejected.

### The signing key must be trusted by the host

A mathematically valid signature from an unknown key does not establish trust.

---

# Development

Requires Node.js.

Run the registry test suite:

```bash
node --test tests/*.test.mjs
```

Generate release metadata:

```bash
node scripts/generate-release.mjs
```

Sign the release:

```bash
node scripts/sign-release.mjs
```

Run the complete release workflow:

```bash
node scripts/generate-release.mjs &&
node scripts/sign-release.mjs &&
node --test tests/*.test.mjs
```

The current tests cover:

- registry digest verification,
- modified registry detection,
- Ed25519 signature verification,
- tampered release detection,
- tracked release verification,
- deterministic signing payload generation, and
- exclusion of the signature value from its own signing payload.

---

# Relationship to Captain Outfit

The registry does **not** install packages.

Captain Outfit does **not** allow applications to define arbitrary trusted mappings.

The responsibilities are intentionally separated.

```text
┌────────────────────────────┐
│ Captain Outfit Registry    │
│                            │
│ What dependency is this?   │
│ What package satisfies it? │
│ Which source is allowed?   │
│ Is this release trusted?   │
└─────────────┬──────────────┘
              │
              │ trusted resolution
              ▼
┌────────────────────────────┐
│ Captain Outfit             │
│                            │
│ What does this host need?  │
│ What will change?          │
│ Was that plan approved?    │
│ Is it still the same?      │
│ May it execute?            │
│ Did it succeed?            │
└────────────────────────────┘
```

Together they establish the boundary:

```text
Application
    │
    │ "I need this."
    ▼
Registry
    │
    │ "This is the trusted implementation."
    ▼
Outfit
    │
    │ "This is the exact approved operation."
    ▼
Privileged Helper
    │
    │ "The operation still matches."
    ▼
Package Manager
```

---

# Design Philosophy

The Registry exists because **dependency identity and package installation are not the same thing**.

An application should not need to know:

```text
which Linux distribution it is running on
which native package manager is present
what the operating-system package is called
which package source is trusted
how privileged installation should occur
```

It should be able to say:

> **I require this capability.**

The registry translates that requirement into a trusted platform-specific identity.

Outfit decides whether that resolution may cross the privilege boundary.

This separation allows dependency knowledge to evolve independently from application code while preserving explicit trust.

---

# Project Status

Captain Outfit Registry is currently under active development.

The current implementation establishes the first complete trust path for the Ubuntu/APT Outfit backend, including:

```text
canonical dependency
        ↓
platform mapping
        ↓
authorized source
        ↓
SHA-256 release integrity
        ↓
Ed25519 signature
        ↓
host trust anchor
        ↓
Outfit resolution
        ↓
approved installation plan
```

Additional dependency identities, platforms, package managers, source policies, and registry-management capabilities will be introduced as the Captain ecosystem expands.

---

## Captain

**Outfit Registry** is part of the Captain toolchain: infrastructure tooling built around explicit contracts, controlled trust boundaries, reproducible operations, and inspectable system state.

**One registry. Verified content. Trusted everywhere.**