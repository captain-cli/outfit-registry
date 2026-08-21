import test from "node:test";
import assert from "node:assert/strict";

import {
    buildSigningPayload
} from "../scripts/lib/signing-payload.mjs";

test(
    "same release produces same signing payload",
    () => {
        const release = {
            version: "0.1.0",
            schemaVersion: "0.1.0",
            registryFile: "registry.json",

            digest: {
                algorithm: "sha256",
                value: "abc123"
            },

            signing: {
                required: true,
                algorithm: "ed25519",
                keyId:
                    "captain.registry.root.v1"
            }
        };

        assert.equal(
            buildSigningPayload(release),
            buildSigningPayload(release)
        );
    }
);

test(
    "signature value is not part of signing payload",
    () => {
        const release = {
            version: "0.1.0",
            schemaVersion: "0.1.0",
            registryFile: "registry.json",

            digest: {
                algorithm: "sha256",
                value: "abc123"
            },

            signing: {
                required: true,
                algorithm: "ed25519",
                keyId:
                    "captain.registry.root.v1",
                signature:
                    "something"
            }
        };

        const withoutSignature = {
            ...release,
            signing: {
                required: true,
                algorithm: "ed25519",
                keyId:
                    "captain.registry.root.v1"
            }
        };

        assert.equal(
            buildSigningPayload(release),
            buildSigningPayload(
                withoutSignature
            )
        );
    }
);