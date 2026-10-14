import test from "node:test";
import assert from "node:assert/strict";

import {
    generateKeyPairSync,
    sign
} from "node:crypto";

import {
    buildSigningPayload
} from "../scripts/lib/signing-payload.mjs";

import {
    verifyReleaseSignature
} from "../scripts/lib/verify-signature.mjs";

import {
    readFile
} from "node:fs/promises";

import {
    resolve
} from "node:path";

function createSignedRelease() {
    const {
        publicKey,
        privateKey
    } = generateKeyPairSync(
        "ed25519"
    );

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

    const payload =
        buildSigningPayload(
            release
        );

    release.signing.signature =
        sign(
            null,
            Buffer.from(
                payload,
                "utf8"
            ),
            privateKey
        ).toString(
            "base64"
        );

    return {
        release,
        publicKey
    };
}

test(
    "valid Ed25519 release signature verifies",
    () => {
        const {
            release,
            publicKey
        } = createSignedRelease();

        const result =
            verifyReleaseSignature(
                release,
                publicKey
            );

        assert.equal(
            result.verified,
            true
        );

        assert.equal(
            result.keyId,
            "captain.registry.root.v1"
        );
    }
);

test(
    "tampered release fails signature verification",
    () => {
        const {
            release,
            publicKey
        } = createSignedRelease();

        release.digest.value =
            "tampered";

        assert.throws(
            () =>
                verifyReleaseSignature(
                    release,
                    publicKey
                ),
            /signature verification failed/
        );
    }
);

test(
    "tracked registry release verifies with tracked public key",
    async () => {
        const release =
            JSON.parse(
                await readFile(
                    resolve(
                        "registry.release.json"
                    ),
                    "utf8"
                )
            );

        const publicKey =
            await readFile(
                resolve(
                    `trust/${release.signing.keyId}.pem`
                ),
                "utf8"
            );

        const result =
            verifyReleaseSignature(
                release,
                publicKey
            );

        assert.equal(
            result.verified,
            true
        );

        assert.equal(
            result.keyId,
            release.signing.keyId
        );
    }
);