import {
    generateKeyPairSync
} from "node:crypto";

import {
    writeFile
} from "node:fs/promises";

import {
    resolve
} from "node:path";

const privatePath =
    resolve(
        process.env.OUTFIT_REGISTRY_PRIVATE_KEY ??
        "../captain-outfit-registry-private.pem"
    );

const publicPath =
    resolve(
        "trust/captain.registry.root.v1.pem"
    );

const {
    publicKey,
    privateKey
} = generateKeyPairSync(
    "ed25519",
    {
        publicKeyEncoding: {
            type: "spki",
            format: "pem"
        },

        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem"
        }
    }
);

await writeFile(
    privatePath,
    privateKey,
    {
        mode: 0o600
    }
);

await writeFile(
    publicPath,
    publicKey,
    "utf8"
);

console.log(
    `Private key: ${privatePath}`
);

console.log(
    `Public key: ${publicPath}`
);