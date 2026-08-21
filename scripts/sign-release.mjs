import {
    readFile,
    writeFile
} from "node:fs/promises";

import {
    sign
} from "node:crypto";

import {
    resolve
} from "node:path";

import {
    buildSigningPayload
} from "./lib/signing-payload.mjs";

const privateKeyPath =
    resolve(
        process.env.OUTFIT_REGISTRY_PRIVATE_KEY ??
        "../captain-outfit-registry-private.pem"
    );

const releasePath =
    resolve(
        "registry.release.json"
    );

const privateKey =
    await readFile(
        privateKeyPath,
        "utf8"
    );

const release =
    JSON.parse(
        await readFile(
            releasePath,
            "utf8"
        )
    );

release.signing = {
    required: true,
    algorithm: "ed25519",
    keyId:
        "captain.registry.root.v1"
};

const payload =
    buildSigningPayload(
        release
    );

const signature =
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

release.signing.signature =
    signature;

await writeFile(
    releasePath,
    `${JSON.stringify(
        release,
        null,
        2
    )}\n`,
    "utf8"
);

console.log(
    `Signed release with key ${release.signing.keyId}`
);