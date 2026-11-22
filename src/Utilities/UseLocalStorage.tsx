import * as React from "react";

type SetLocalStorageItem = <T>(key: string, value: T | null | undefined) => boolean;
type GetLocalStorageItem = <T>(key: string) => T | null | undefined;
type GetLocalStorageItemDefault = <T>(key: string, defaultValue: T) => T;
type ClearLocalStorage = () => void;

/**
 * A callback for the {@link useLocalStorage} hook errors.
 */
type LocalStorageErrorHandler = (operation: "read" | "write", key: string, error: unknown) => void;

/**
 * A custom hook for reading and writing JSON values in the local storage.
 * Errors (corrupted values, a full storage or a blocked storage) never throw;
 * they are reported to the optional {@link LocalStorageErrorHandler}.
 * @param onError An optional callback called when a read or a write fails.
 */
const useLocalStorage = (onError?: LocalStorageErrorHandler) => {
    // Keep the latest handler in a ref so the returned callbacks stay stable
    const onErrorRef = React.useRef(onError);
    React.useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const reportError = React.useCallback((operation: "read" | "write", key: string, error: unknown) => {
        onErrorRef.current?.(operation, key, error);
    }, []);

    const readItem = React.useCallback(
        (key: string): { found: boolean; value: unknown } => {
            try {
                const item = localStorage.getItem(key);
                if (typeof item === "string") {
                    return { found: true, value: JSON.parse(item) };
                }
            } catch (error) {
                reportError("read", key, error);
            }
            return { found: false, value: undefined };
        },
        [reportError]
    );

    const setLocalStorageItem = React.useCallback(
        <T,>(key: string, value: T | null | undefined): boolean => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                reportError("write", key, error);
                return false;
            }
        },
        [reportError]
    );

    const getLocalStorageItem = React.useCallback(
        <T,>(key: string): T | null | undefined => {
            const { found, value } = readItem(key);
            return found ? (value as T) : null;
        },
        [readItem]
    );

    const getLocalStorageItemDefault = React.useCallback<GetLocalStorageItemDefault>(
        <T,>(key: string, defaultValue: T): T => {
            const { found, value } = readItem(key);
            return found ? ((value as T) ?? defaultValue) : defaultValue;
        },
        [readItem]
    );

    const clearLocalStorage = React.useCallback(() => {
        try {
            localStorage.clear();
        } catch (error) {
            reportError("write", "*", error);
        }
    }, [reportError]);

    return [
        setLocalStorageItem as SetLocalStorageItem,
        getLocalStorageItem as GetLocalStorageItem,
        getLocalStorageItemDefault as GetLocalStorageItemDefault,
        clearLocalStorage as ClearLocalStorage,
    ] as const;
};

export type { LocalStorageErrorHandler };
export { useLocalStorage };
