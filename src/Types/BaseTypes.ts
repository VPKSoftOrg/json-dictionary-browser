// Dictionary to access field via keys
type Dictionary = {
    [keys: string]: string;
};

type DictionaryEntry = {
    id: number;
} & Dictionary;

type BaseProps = {
    className?: string;
};

export type { Dictionary, DictionaryEntry, BaseProps };
