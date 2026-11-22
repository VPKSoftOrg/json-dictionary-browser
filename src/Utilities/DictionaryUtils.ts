import type Fuse from "fuse.js";
import type { DictionaryEntry, DictionaryTab } from "../Types/BaseTypes";
import { getArrayFields } from "./ArrayUtils";

/** The result of parsing a dictionary JSON file. */
type ParseDictionaryResult =
    | { success: true; dictionary: DictionaryEntry[]; fields: Array<string> }
    | { success: false; error: string };

/** A function reading a value from a persistent storage, returning the default value if not found. */
type StorageGetter = <T>(key: string, defaultValue: T) => T;

/** The maximum number of search results displayed. */
const maxSearchResults = 10;

/** The maximum Fuse.js score (0 = perfect match, 1 = no match) for a search result to be displayed. */
const maxSearchScore = 0.3;

/** The default name for a dictionary without a name. */
const defaultDictionaryName = "Dictionary";

/**
 * Parses the text contents of a dictionary JSON file. The entry `id` fields are reassigned by the array index.
 * @param text The JSON text.
 * @returns The parsed dictionary with its fields or an error message.
 */
const parseDictionaryJson = (text: string): ParseDictionaryResult => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        return { success: false, error: `Error opening the file: '${e}'.` };
    }

    if (!parsed) {
        return { success: false, error: "The file is empty." };
    }

    if (!Array.isArray(parsed)) {
        return { success: false, error: "The contents must be a JSON array." };
    }

    if (parsed.some(f => typeof f !== "object" || f === null || Array.isArray(f))) {
        return { success: false, error: "The JSON array items must be objects." };
    }

    const dictionary = parsed.map((f, i) => ({ ...f, id: i })) as DictionaryEntry[];
    return { success: true, dictionary, fields: getArrayFields(dictionary) };
};

/**
 * Creates a copy of the dictionary containing only the selected fields and the `id` field.
 * @param dictionary The dictionary to filter.
 * @param selectedFields The fields to keep.
 * @returns A new dictionary with the fields not selected removed.
 */
const keepSelectedFields = (dictionary: DictionaryEntry[], selectedFields: Array<string>): DictionaryEntry[] => {
    return dictionary.map(entry => {
        const result = { id: entry.id } as DictionaryEntry;
        for (const field of selectedFields) {
            if (field !== "id" && field in entry) {
                result[field] = entry[field];
            }
        }
        return result;
    });
};

/**
 * Searches the dictionary using the specified Fuse.js instance.
 * @param fuse The Fuse.js instance indexing the dictionary.
 * @param query The search query.
 * @returns The best matching entries ordered by relevance or `undefined` if the query is empty.
 */
const searchDictionary = (fuse: Fuse<DictionaryEntry>, query: string): DictionaryEntry[] | undefined => {
    if (query.trim() === "") {
        return undefined;
    }

    return fuse
        .search(query)
        .filter(({ score }) => (score ?? 1) < maxSearchScore)
        .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
        .slice(0, maxSearchResults)
        .map(({ item }) => item);
};

/**
 * Gets the next unused entry `id` for the dictionary.
 * @param dictionary The dictionary.
 * @returns The largest existing `id` plus one, or `1` for an empty dictionary.
 */
const nextEntryId = (dictionary: DictionaryEntry[]) => {
    return dictionary.map(d => d.id).reduce((a, b) => Math.max(a, b), 0) + 1;
};

/**
 * Generates a unique key for a dictionary tab.
 * @returns A unique string key.
 */
const generateTabKey = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Creates a new dictionary tab.
 * @param name The name of the dictionary. An empty name is replaced with the default name.
 * @param dictionary The dictionary data.
 * @param keys The visible and searchable field names.
 * @returns A new {@link DictionaryTab}.
 */
const createDictionaryTab = (name: string, dictionary: DictionaryEntry[], keys: Array<string>): DictionaryTab => {
    return {
        key: generateTabKey(),
        name: name.trim() === "" ? defaultDictionaryName : name.trim(),
        dictionary,
        keys,
    };
};

/**
 * Gets a dictionary name from a file name by removing the path and the `.json` extension.
 * @param fileName The file name.
 * @returns The dictionary name.
 */
const fileNameToDictionaryName = (fileName: string) => {
    const baseName = fileName.split(/[\\/]/).pop() ?? "";
    const name = baseName.replace(/\.json$/i, "").trim();
    return name === "" ? defaultDictionaryName : name;
};

/**
 * Gets a safe download file name for a dictionary name.
 * @param name The dictionary name.
 * @returns A file name with the `.json` extension.
 */
const dictionaryNameToFileName = (name: string | undefined) => {
    const safeName = (name ?? "")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\p{Cc}/gu, "_")
        .trim();
    return `${safeName === "" ? "data" : safeName}.json`;
};

/**
 * Gets a name for a new dictionary which is not used by the existing dictionaries.
 * @param existingNames The names of the existing dictionaries.
 * @returns A name such as "Dictionary 2".
 */
const newDictionaryName = (existingNames: Array<string>) => {
    let index = existingNames.length + 1;
    while (existingNames.includes(`${defaultDictionaryName} ${index}`)) {
        index++;
    }
    return `${defaultDictionaryName} ${index}`;
};

/**
 * Loads the dictionary tabs from the storage. If no tabs are stored, a dictionary stored by an older
 * application version (the `dictionary` and `keys` storage items) is converted into a single tab.
 * @param getItem A function to read a value from the storage.
 * @returns The dictionary tabs.
 */
const loadDictionaryTabs = (getItem: StorageGetter): DictionaryTab[] => {
    const tabs = getItem<DictionaryTab[] | null>("dictionaries", null);
    if (Array.isArray(tabs)) {
        return tabs.filter(f => f && typeof f.key === "string" && Array.isArray(f.dictionary));
    }

    const legacyDictionary = getItem<DictionaryEntry[] | null>("dictionary", null);
    const legacyKeys = getItem<Array<string> | null>("keys", null);
    if (Array.isArray(legacyDictionary) && (legacyDictionary.length > 0 || (legacyKeys?.length ?? 0) > 0)) {
        return [{ key: "default", name: defaultDictionaryName, dictionary: legacyDictionary, keys: legacyKeys ?? [] }];
    }

    return [];
};

/**
 * Gets the key of the tab to activate after the specified tab has been closed.
 * @param tabs The tabs before closing.
 * @param closedKey The key of the closed tab.
 * @param activeKey The key of the currently active tab.
 * @returns The key of the tab to activate or `undefined` if no tabs remain.
 */
const activeKeyAfterClose = (tabs: DictionaryTab[], closedKey: string, activeKey: string | undefined) => {
    const remaining = tabs.filter(f => f.key !== closedKey);
    if (activeKey !== closedKey && remaining.some(f => f.key === activeKey)) {
        return activeKey;
    }
    const closedIndex = tabs.findIndex(f => f.key === closedKey);
    return remaining[Math.min(Math.max(closedIndex - 1, 0), remaining.length - 1)]?.key;
};

export type { ParseDictionaryResult, StorageGetter };
export {
    activeKeyAfterClose,
    createDictionaryTab,
    defaultDictionaryName,
    dictionaryNameToFileName,
    fileNameToDictionaryName,
    keepSelectedFields,
    loadDictionaryTabs,
    newDictionaryName,
    nextEntryId,
    parseDictionaryJson,
    searchDictionary,
};
