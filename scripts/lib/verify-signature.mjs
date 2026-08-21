import {
    verify
} from "node:crypto";

import {
    buildSigningPayload
} from "./signing-payload.mjs";

export function verifyReleaseSignature(
    release,
    publicKey
) {
    if (
        release.signing?.required !==
        true
    ) {
        throw new Error(
            "Registry release signature is required"
        );
    }

    if (
        release.signing.algorithm !==
        "ed25519"
    ) {
        throw new Error(
            `Unsupported registry signing algorithm: ${
                release.signing.algorithm ??
                "missing"
            }`
        );
    }

    if (
        typeof release.signing.keyId !==
        "string" ||
        release.signing.keyId.length ===
        0
    ) {
        throw new Error(
            "Registry signing key id is missing"
        );
    }

    if (
        typeof release.signing.signature !==
        "string" ||
        release.signing.signature.length ===
        0
    ) {
        throw new Error(
            "Registry signature is missing"
        );
    }

    const payload =
        buildSigningPayload(
            release
        );

    const valid =
        verify(
            null,
            Buffer.from(
                payload,
                "utf8"
            ),
            publicKey,
            Buffer.from(
                release.signing.signature,
                "base64"
            )
        );

    if (!valid) {
        throw new Error(
            "Registry signature verification failed"
        );
    }

    return {
        algorithm:
            "ed25519",
        keyId:
        release.signing.keyId,
        verified:
            true
    };
}