import Fuse from "fuse.js";
import type { DictionaryEntry, DictionaryTab } from "../Types/BaseTypes";
import {
    activeKeyAfterClose,
    createDictionaryTab,
    dictionaryNameToFileName,
    fileNameToDictionaryName,
    keepSelectedFields,
    loadDictionaryTabs,
    newDictionaryName,
    nextEntryId,
    parseDictionaryJson,
    searchDictionary,
} from "../Utilities/DictionaryUtils";

const storageGetter = (values: Record<string, unknown>) => {
    return <T>(key: string, defaultValue: T): T => (key in values ? (values[key] as T) : defaultValue);
};

const entries = (items: Array<Record<string, string | number>>) => items as unknown as DictionaryEntry[];

const tab = (key: string, name = key): DictionaryTab => ({ key, name, dictionary: [], keys: [] });

describe("parseDictionaryJson", () => {
    it("parses an array of objects, reassigns the ids by index and collects the fields", () => {
        const result = parseDictionaryJson(
            JSON.stringify([
                { id: 10, name: "^5", description: "High-five" },
                { id: 11, name: "AFK", extra: "x" },
            ])
        );

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.dictionary.map(f => f.id)).toEqual([0, 1]);
            expect(result.dictionary[0].name).toBe("^5");
            expect(result.fields).toEqual(["id", "name", "description", "extra"]);
        }
    });

    it.each([
        ["{ not json", "Error opening the file"],
        ["null", "The file is empty."],
        ['{ "a": 1 }', "The contents must be a JSON array."],
        ["[1, 2]", "The JSON array items must be objects."],
    ])("rejects %s", (text, error) => {
        const result = parseDictionaryJson(text);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain(error);
        }
    });
});

describe("keepSelectedFields", () => {
    it("keeps only the selected fields and the id without changing the original", () => {
        const dictionary = entries([{ id: 1, name: "a", description: "b", other: "c" }]);
        const result = keepSelectedFields(dictionary, ["name", "other"]);

        expect(result).toEqual([{ id: 1, name: "a", other: "c" }]);
        expect(dictionary[0].description).toBe("b");
    });
});

describe("searchDictionary", () => {
    const dictionary = entries([
        { id: 1, name: "AFK", description: "Away from keyboard" },
        { id: 2, name: "BRB", description: "Be right back" },
        { id: 3, name: "LOL", description: "Laughing out loud" },
    ]);
    const fuse = new Fuse(dictionary, { keys: ["name", "description"], includeScore: true });

    it("returns undefined for an empty query", () => {
        expect(searchDictionary(fuse, "  ")).toBeUndefined();
    });

    it("returns the best match first", () => {
        expect(searchDictionary(fuse, "BRB")?.[0].id).toBe(2);
    });

    it("returns at most ten results", () => {
        const many = entries(Array.from({ length: 30 }, (_, i) => ({ id: i, name: `item${i}` })));
        const manyFuse = new Fuse(many, { keys: ["name"], includeScore: true });
        expect(searchDictionary(manyFuse, "item")?.length).toBe(10);
    });
});

describe("nextEntryId", () => {
    it("returns the largest id plus one", () => {
        expect(nextEntryId(entries([{ id: 3 }, { id: 7 }]))).toBe(8);
        expect(nextEntryId([])).toBe(1);
    });
});

describe("createDictionaryTab", () => {
    it("creates tabs with unique keys and a trimmed name", () => {
        const a = createDictionaryTab("  Chat  ", [], ["name"]);
        const b = createDictionaryTab("Chat", [], ["name"]);

        expect(a.name).toBe("Chat");
        expect(a.keys).toEqual(["name"]);
        expect(a.key).not.toBe(b.key);
    });

    it("uses the default name for an empty name", () => {
        expect(createDictionaryTab(" ", [], []).name).toBe("Dictionary");
    });
});

describe("dictionary names", () => {
    it("gets the dictionary name from a file name", () => {
        expect(fileNameToDictionaryName("chat_abbreviations.json")).toBe("chat_abbreviations");
        expect(fileNameToDictionaryName("C:\\data\\Words.JSON")).toBe("Words");
        expect(fileNameToDictionaryName(".json")).toBe("Dictionary");
    });

    it("gets a safe download file name", () => {
        expect(dictionaryNameToFileName("My: words?")).toBe("My_ words_.json");
        expect(dictionaryNameToFileName(undefined)).toBe("data.json");
        expect(dictionaryNameToFileName("  ")).toBe("data.json");
    });

    it("gets an unused name for a new dictionary", () => {
        expect(newDictionaryName([])).toBe("Dictionary 1");
        expect(newDictionaryName(["Dictionary 2"])).toBe("Dictionary 3");
        expect(newDictionaryName(["a", "b"])).toBe("Dictionary 3");
    });
});

describe("loadDictionaryTabs", () => {
    it("loads the stored tabs", () => {
        const tabs = [tab("a"), tab("b")];
        expect(loadDictionaryTabs(storageGetter({ dictionaries: tabs }))).toEqual(tabs);
    });

    it("converts a dictionary stored by an older version into a tab", () => {
        const dictionary = [{ id: 0, name: "AFK" }];
        const result = loadDictionaryTabs(storageGetter({ dictionary, keys: ["name"] }));

        expect(result).toEqual([{ key: "default", name: "Dictionary", dictionary, keys: ["name"] }]);
    });

    it("returns no tabs when nothing is stored", () => {
        expect(loadDictionaryTabs(storageGetter({}))).toEqual([]);
        expect(loadDictionaryTabs(storageGetter({ dictionary: [], keys: [] }))).toEqual([]);
    });

    it("prefers the stored tabs over the old format", () => {
        expect(loadDictionaryTabs(storageGetter({ dictionaries: [], dictionary: [{ id: 0 }] }))).toEqual([]);
    });
});

describe("activeKeyAfterClose", () => {
    const tabs = [tab("a"), tab("b"), tab("c")];

    it("keeps the active tab when another tab is closed", () => {
        expect(activeKeyAfterClose(tabs, "a", "c")).toBe("c");
    });

    it("activates the previous tab when the active tab is closed", () => {
        expect(activeKeyAfterClose(tabs, "b", "b")).toBe("a");
        expect(activeKeyAfterClose(tabs, "a", "a")).toBe("b");
    });

    it("returns undefined when the last tab is closed", () => {
        expect(activeKeyAfterClose([tab("a")], "a", "a")).toBeUndefined();
    });
});
