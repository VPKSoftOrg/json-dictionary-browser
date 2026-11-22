// Minimal Semantic Versioning 2.0.0 helper for the CI/CD workflows (no dependencies).
//
// Usage:
//   node .github/scripts/semver.mjs validate <version>         exits 1 if <version> is not valid SemVer
//   node .github/scripts/semver.mjs compare <a> <b>            prints -1, 0 or 1 (a < b, a == b, a > b)
//   node .github/scripts/semver.mjs prerelease <version>       prints "true" or "false"

const SEMVER =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const parse = version => {
    const match = SEMVER.exec(String(version ?? "").replace(/^v/, ""));
    if (!match) {
        throw new Error(`Invalid semantic version: "${version}"`);
    }
    return {
        core: [match[1], match[2], match[3]].map(BigInt),
        pre: match[4] ? match[4].split(".") : [],
    };
};

const compareIdentifiers = (a, b) => {
    const aNum = /^\d+$/.test(a);
    const bNum = /^\d+$/.test(b);
    if (aNum && bNum) {
        return BigInt(a) === BigInt(b) ? 0 : BigInt(a) < BigInt(b) ? -1 : 1;
    }
    if (aNum !== bNum) {
        return aNum ? -1 : 1; // Numeric identifiers have lower precedence.
    }
    return a === b ? 0 : a < b ? -1 : 1;
};

const compare = (a, b) => {
    const va = parse(a);
    const vb = parse(b);
    for (let i = 0; i < 3; i++) {
        if (va.core[i] !== vb.core[i]) {
            return va.core[i] < vb.core[i] ? -1 : 1;
        }
    }
    // A version without a pre-release has higher precedence than one with it.
    if (va.pre.length === 0 || vb.pre.length === 0) {
        return va.pre.length === vb.pre.length ? 0 : va.pre.length === 0 ? 1 : -1;
    }
    for (let i = 0; i < Math.max(va.pre.length, vb.pre.length); i++) {
        if (va.pre[i] === undefined) {
            return -1;
        }
        if (vb.pre[i] === undefined) {
            return 1;
        }
        const result = compareIdentifiers(va.pre[i], vb.pre[i]);
        if (result !== 0) {
            return result;
        }
    }
    return 0;
};

const [command, ...args] = process.argv.slice(2);
try {
    switch (command) {
        case "validate":
            parse(args[0]);
            break;
        case "compare":
            console.log(compare(args[0], args[1]));
            break;
        case "prerelease":
            console.log(parse(args[0]).pre.length > 0 ? "true" : "false");
            break;
        default:
            throw new Error(`Unknown command: "${command}"`);
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
