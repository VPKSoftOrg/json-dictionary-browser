// Dictionary to access field via keys
type Dictionary = {
    [keys: string]: string;
};

type DictionaryEntry = {
    id: number;
} & Dictionary;

/** A named dictionary opened in its own tab. */
type DictionaryTab = {
    /** The unique key of the tab. */
    key: string;
    /** The user-given name of the dictionary. */
    name: string;
    /** The dictionary entries. */
    dictionary: DictionaryEntry[];
    /** The visible and searchable field names. */
    keys: Array<string>;
};

type BaseProps = {
    className?: string;
};

export type { BaseProps, Dictionary, DictionaryEntry, DictionaryTab };
