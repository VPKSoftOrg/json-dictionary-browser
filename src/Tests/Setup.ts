// Browser APIs used by Ant Design which jsdom does not implement.

const noop = () => undefined;

Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: noop,
        removeListener: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
    }),
});

class ResizeObserverMock {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
}

Object.defineProperty(globalThis, "ResizeObserver", { writable: true, value: ResizeObserverMock });

// jsdom does not implement the pseudo-element argument and logs an error for it, so it is dropped.
const originalGetComputedStyle = globalThis.getComputedStyle;
globalThis.getComputedStyle = (element: Element) => originalGetComputedStyle(element);

// jsdom has no Blob URLs; the download hook creates one for the active dictionary.
Object.defineProperty(URL, "createObjectURL", { writable: true, value: () => "blob:test" });
Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: noop });
