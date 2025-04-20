import * as React from "react";

type SetLocalStorageItem = <T>(key: string, value: T | null | undefined) => void;
type GetLocalStorageItem = <T>(key: string) => T | null | undefined;
type GetLocalStorageItemDefault = <T>(key: string, defaultValue: T) => T;
type ClearLocalStorage = () => void;

const useLocalStorage = () => {
    const setLocalStorageItem = React.useCallback(<T,>(key: string, value: T | null | undefined) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, []);

    const getLocalStorageItem = React.useCallback(<T,>(key: string): T | null | undefined => {
        const item = localStorage.getItem(key);
        if (typeof item === "string") {
            return JSON.parse(item);
        }
        return null;
    }, []);

    const getLocalStorageItemDefault = React.useCallback<GetLocalStorageItemDefault>(
        <T,>(key: string, defaultValue: T): T => {
            const item = localStorage.getItem(key);
            if (typeof item === "string") {
                return JSON.parse(item) ?? defaultValue;
            }
            return defaultValue;
        },
        []
    );

    const clearLocalStorage = React.useCallback(() => {
        localStorage.clear();
    }, []);

    return [
        setLocalStorageItem as SetLocalStorageItem,
        getLocalStorageItem as GetLocalStorageItem,
        getLocalStorageItemDefault as GetLocalStorageItemDefault,
        clearLocalStorage as ClearLocalStorage,
    ] as const;
};

export { useLocalStorage };
