# AGENTS.md

Guidance for AI coding agents working in this repository. See `README.md` for the project overview and `CLAUDE.md` for the commands, code style and architecture.

## Git workflow

Changes go to `develop` through pull requests, one branch per change:

1. Before starting, check `git status`. If the repository folder has local uncommitted changes (modified, staged or untracked files, other than agent tool folders such as `.claude/`), stop and ask the user what to do with them. Otherwise switch to `develop` and update it from `origin` (`git pull --ff-only`).
2. Create a new branch from `develop` (e.g. `feature/<short-name>` or `fix/<short-name>`).
3. Commit the changes to that branch and push it to `origin`.
4. Create a pull request into `develop` without asking for confirmation first.

## Before finishing a change

Run `npm run build`, `npm run lint` and `npm test`; CI runs all three and each must pass. `npm run lint-fix` applies Biome's formatting and safe fixes.

## Tests

Tests use Jest with `@swc/jest`, jsdom and React Testing Library, and live in `src/Tests/` as `*.test.ts` / `*.test.tsx` (PascalCase file names, as Biome requires). SWC only strips the types — TypeScript 7 has no compiler API for ts-jest — so the tests are type checked by `tsc -b` through `tsconfig.test.json` (`tsconfig.app.json` excludes `src/Tests` to keep the Jest types out of the application). Biome lints them like the application code.

- Put new non-UI logic in a pure module such as `src/Utilities/DictionaryUtils.ts` and unit test it there, rather than adding it inline to `App.tsx`.
- Add or update tests for the behaviour you change: utility tests for logic, component tests (`render` + `screen`/`fireEvent`) for popups and `App` flows.
- Query elements by role, label or text (give inputs an `aria-label` if needed), not by CSS class names.
- `src/Tests/Setup.ts` provides the browser APIs that AntD and the app need but jsdom lacks (`matchMedia`, `ResizeObserver`, Blob URLs); add any further polyfills there. CSS, image and `virtual:pwa-register/react` imports are mapped to stubs in `src/Tests/Mocks/` by `jest.config.js`, which also defines the `__APP_VERSION__` and `__APP_NAME__` globals.
- AntD modals animate; wrap clicks that close them in `act(async () => ...)` and assert with `waitFor`/`findBy*`.

## Stored data compatibility

Users' dictionaries live only in their browser's `localStorage` (`dictionaries`, `activeDictionary`, `darkMode`). A change to the stored shape must keep existing data loadable: convert old data on load as `loadDictionaryTabs` does for the pre-1.1 `dictionary`/`keys` items, cover the conversion with a test, and bump the version accordingly (see below). The same applies to the imported/exported dictionary JSON format.

## Versioning (SemVer)

The application follows [Semantic Versioning 2.0.0](https://semver.org/): the version is `MAJOR.MINOR.PATCH` (optionally with a pre-release suffix such as `1.2.0-rc.1`) and its single source of truth is the `version` field in `package.json`, which Vite injects at build time as `__APP_VERSION__` (shown in the About popup). Bump **MAJOR** for breaking changes, such as an incompatible change to the dictionary JSON format or to the data stored in `localStorage`; **MINOR** for new backwards-compatible features; **PATCH** for backwards-compatible bug fixes. Change the version with `npm version <major|minor|patch> --no-git-tag-version` so `package-lock.json` stays in sync, and do not create tags by hand: when a PR that raises the version is merged into `develop`, `.github/workflows/release.yml` creates the `vX.Y.Z` tag and the GitHub release (pre-release for versions with a `-` suffix). A PR that does not change the version produces no release.
