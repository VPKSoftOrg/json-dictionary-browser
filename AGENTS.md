# AGENTS.md

Guidance for AI coding agents working in this repository. See `README.md` for the project overview.

## Versioning (SemVer)

The application follows [Semantic Versioning 2.0.0](https://semver.org/): the version is `MAJOR.MINOR.PATCH` (optionally with a pre-release suffix such as `1.2.0-rc.1`) and its single source of truth is the `version` field in `package.json`, which Vite injects at build time as `__APP_VERSION__` (shown in the About popup). Bump **MAJOR** for breaking changes, such as an incompatible change to the dictionary JSON format or to the data stored in `localStorage`; **MINOR** for new backwards-compatible features; **PATCH** for backwards-compatible bug fixes. Change the version with `npm version <major|minor|patch> --no-git-tag-version` so `package-lock.json` stays in sync, and do not create tags by hand: when a PR that raises the version is merged into `develop`, `.github/workflows/release.yml` creates the `vX.Y.Z` tag and the GitHub release (pre-release for versions with a `-` suffix). A PR that does not change the version produces no release.
