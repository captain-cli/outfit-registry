export function buildSigningPayload(release) {
    if (
        !release ||
        typeof release !== "object"
    ) {
        throw new Error(
            "Registry release manifest is invalid"
        );
    }

    return JSON.stringify({
        version:
        release.version,

        schemaVersion:
        release.schemaVersion,

        registryFile:
        release.registryFile,

        digest: {
            algorithm:
            release.digest?.algorithm,

            value:
            release.digest?.value
        },

        signing: {
            required:
            release.signing?.required,

            algorithm:
            release.signing?.algorithm,

            keyId:
            release.signing?.keyId
        }
    });
}