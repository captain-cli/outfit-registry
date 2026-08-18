# Trust Model

A source must be registered before a mapping may reference it. A mapping is trusted only for the exact canonical capability, target platform, package manager, package name, and source. Changing any member of that tuple is a security-sensitive change. Future releases add signatures, immutable snapshots, provenance, and organization trust roots.
