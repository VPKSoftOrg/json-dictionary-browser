# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A client-only PWA (React 19 + Vite + TypeScript, Ant Design 6 UI) for browsing, searching (Fuse.js) and editing dictionaries stored as JSON arrays of objects; several named dictionaries can be open at once in tabs. There is no backend; all data lives in the browser's `localStorage`. `sample_data/chat_abbreviations.json` is example input.

Data format: a JSON array where each entry has a numeric `id` plus arbitrary string fields, e.g. `{ "id": 10, "name": "^5", "description": "High-five" }` (typed as `DictionaryEntry` in `src/Types/BaseTypes.ts`).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` type check (application, Vite config and tests), then `vite build` into `dist/`
- `npm run lint` — Biome lint + format check + check
- `npm run lint-fix` — apply Biome fixes and formatting
- `npm test` — run the Jest test suite (`npx jest src/Tests/App.test.tsx` for one file, `-t "<name>"` for one test)
- `npm run preview` — serve the production build
- `npm run generate-pwa-assets` — regenerate PWA icons in `public/` from `pwa-assets.config.ts`

Versioning follows SemVer from `package.json` `version`; releases/tags are created by `.github/workflows/release.yml` when a merged PR raises it. `AGENTS.md` covers versioning, how to write tests, and keeping stored `localStorage` data compatible — read it before changing those areas.

Tests use Jest 30 + `@swc/jest` + jsdom + React Testing Library and live in `src/Tests/*.test.ts(x)`. TypeScript is 7 (the native compiler, no JS compiler API), so ts-jest cannot be used: SWC strips the types and `tsc -b` type checks the tests through `tsconfig.test.json`. `jest.config.js` maps CSS/image imports and the `virtual:pwa-register/react` module to stubs in `src/Tests/Mocks/` and defines the `__APP_VERSION__`/`__APP_NAME__` globals. `src/Tests/Setup.ts` polyfills what jsdom lacks (`matchMedia`, `ResizeObserver`, `URL.createObjectURL`).

CI (`.github/workflows/node.js.yml`, Node 22, on `develop`) runs `npm install`, `npm run build`, `npm run lint`, `npm test` — all must pass. The release and GitHub Pages deploy workflows also lint and test before building.

## Code style

Biome (`biome.json`) is the only linter/formatter: 4-space indent, 120-column lines, double quotes. It only checks `src/**/*.ts(x)` (not `.d.ts`); config files outside `src` (e.g. `vite.config.ts`, `jest.config.js`, the JSON configs) are not linted, so match their existing style by hand. Filenames in `src` must be PascalCase (`useFilenamingConvention`), empty blocks are errors (use a `noop` function in mocks), and exports go last with `export type` before `export` (`npm run lint-fix` orders them).

Component conventions used throughout `src/`:
- Components are declared with `let`, then reassigned with `styled-components` (`Comp = styled(Comp)\`...\``), and the root element gets `className={classNames(className, Comp.name)}`. Styles live in that styled block, not in CSS files.
- React is imported as `import * as React from "react"` and hooks are called as `React.useState`, etc. Callbacks are wrapped in `React.useCallback`.
- Named exports only (`export { X };`).
- A trailing `//` after a JSX tag name (`<Button //`) is used to force one-prop-per-line formatting.

## Architecture

Nearly all application state is in `src/App.tsx`:
- **Tabs**: several named dictionaries can be open at once, each a `DictionaryTab` (`key`, `name`, `dictionary`, `keys` = visible/searchable field names; `src/Types/BaseTypes.ts`) shown in an AntD `editable-card` `Tabs` bar. Only the active tab's table is rendered; switching tabs resets the search and row selection. Tabs are renamed with `DictionaryNamePopup` (toolbar button or double-click on the tab) and closed after a confirmation.
- **Persistent state** (`dictionaries`, `activeDictionary` = active tab key, `darkMode`) is initialized from and written back to `localStorage` through `useLocalStorage` (`src/Utilities/UseLocalStorage.tsx`, JSON-serialized). It never throws: corrupted reads fall back to the default and failed writes are reported to its `onError` callback, which `App` shows as a notification. Every change to the tabs goes through `updateDictionaries` (or `updateActiveDictionary`), which sets state and calls `setItem("dictionaries", ...)` together. `loadDictionaryTabs` converts the pre-1.1 `dictionary`/`keys` items into a single tab when no `dictionaries` item exists.
- **Pure logic** (parsing/validating imports, field filtering, search, naming, tab-close handling, storage migration) lives in `src/Utilities/DictionaryUtils.ts` so it can be unit tested; keep `App.tsx` to state and UI.
- **Import flow**: `DragDropOpenFileAreaButton` (drag-drop or File System Access API picker; problems are reported through `onOpenError`) hands a `File` to `onGetFile`, which validates it with `parseDictionaryJson` (reassigning `id`s by index), stashes the data in `dictionaryTempRef`/`keysTempRef`, then opens `FieldSelectPopup` with a name taken from the file name. On accept, `keepSelectedFields` drops unselected fields and the result opens in a new tab. The same popup is reused for "New dictionary" (`addNew` mode, default fields `name`/`value`).
- **Search**: a memoized `Fuse` instance over the active dictionary keyed by its `keys`; `searchDictionary` keeps results with a score below 0.3, capped at 10. The submitted query is state and the displayed rows are memoized from the live dictionary, so they stay current when entries change. The row selection is pruned to the rows currently displayed.
- **Table**: AntD virtual `Table` with columns generated from `keys`, keyed by the tab key so it is re-created on tab switch; an `Empty` placeholder shows when no tabs are open. Its scroll height is computed manually (AntD has no max-height) from the table container minus `.ant-table-header`, by a `ResizeObserver` on both that is re-attached when the columns or the active tab change. Layout changes to the table container may need this adjusted.
- **Export**: `useDynamicDownload` keeps a Blob URL for the active dictionary and downloads it as `<dictionary name>.json` (`dictionaryNameToFileName`).
- **Theming**: `AntdThemeProvider` (`src/Context/AntdThemeContext.tsx`) switches the AntD algorithm between light/dark and also paints `body`/`#root` backgrounds from the theme token.
- **PWA**: configured in `vite.config.ts` via `vite-plugin-pwa` with `registerType: "prompt"`; `src/PwaBadge.tsx` shows the update/offline-ready prompt.
