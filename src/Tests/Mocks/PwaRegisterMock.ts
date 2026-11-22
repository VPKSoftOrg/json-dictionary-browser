// A stand-in for the vite-plugin-pwa virtual module, which only exists in a Vite build.
const noop = () => undefined;

const useRegisterSW = () => ({
    needRefresh: [false, noop] as [boolean, (value: boolean) => void],
    offlineReady: [false, noop] as [boolean, (value: boolean) => void],
    updateServiceWorker: async () => undefined,
});

export { useRegisterSW };
