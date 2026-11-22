import { renderHook } from "@testing-library/react";
import { useLocalStorage } from "../Utilities/UseLocalStorage";

describe("useLocalStorage", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it("stores values as JSON and reads them back", () => {
        const { result } = renderHook(() => useLocalStorage());
        const [setItem, getItem] = result.current;

        expect(setItem("value", { a: 1, b: ["x"] })).toBe(true);

        expect(localStorage.getItem("value")).toBe('{"a":1,"b":["x"]}');
        expect(getItem("value")).toEqual({ a: 1, b: ["x"] });
    });

    it("returns the default value for a missing item", () => {
        const { result } = renderHook(() => useLocalStorage());
        const [, getItem, getItemDefault] = result.current;

        expect(getItem("missing")).toBeNull();
        expect(getItemDefault("missing", 5)).toBe(5);
    });

    it("reports a corrupted value and returns the default value", () => {
        const onError = jest.fn();
        localStorage.setItem("broken", "{ not json");
        const { result } = renderHook(() => useLocalStorage(onError));
        const [, , getItemDefault] = result.current;

        expect(getItemDefault("broken", "fallback")).toBe("fallback");
        expect(onError).toHaveBeenCalledWith("read", "broken", expect.any(SyntaxError));
    });

    it("reports a failed write without throwing", () => {
        const onError = jest.fn();
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("QuotaExceededError");
        });
        const { result } = renderHook(() => useLocalStorage(onError));
        const [setItem] = result.current;

        expect(setItem("value", 1)).toBe(false);
        expect(onError).toHaveBeenCalledWith("write", "value", expect.any(Error));
    });
});
