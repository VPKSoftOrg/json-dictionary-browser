import * as React from "react";

/**
 * A custom hook to debounce a callback for a specified time.
 * The timer resets if the callback it self is changed or the optional dependencies change.
 * @param {() => void} callBack The callback to be debounced.
 * @param {number} timeOut The debounce time in milliseconds.
 * @param {() => boolean} postpone A function that returns true if the callback should be postponed.
 * @param {React.DependencyList} deps Additional dependencies for the effect.
 */
const useDebounce = (
    callBack: () => void | Promise<void>,
    timeOut: number,
    postpone?: () => boolean,
    deps?: React.DependencyList
) => {
    const lastTime = React.useRef<Date>(new Date());
    const effectPending = React.useRef<boolean>(false);

    const intervalCallBack = React.useCallback(() => {
        if (postpone?.() === true) {
            lastTime.current = new Date();
            effectPending.current = false;
            return;
        }

        const timeDiffMs = Date.now() - lastTime.current.getTime();
        if (timeDiffMs > timeOut && effectPending.current) {
            lastTime.current = new Date();
            effectPending.current = false;
            void callBack();
            lastTime.current = new Date();
        }
    }, [callBack, postpone, timeOut]);

    React.useEffect(() => {
        const onInterval = setInterval(intervalCallBack, 50);

        return () => clearInterval(onInterval);
    }, [intervalCallBack]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: The deps array is common in hooks.
    React.useEffect(() => {
        lastTime.current = new Date();
        effectPending.current = true;
    }, [deps, callBack]);
};

/**
 * A custom hook to debounce a callback after a specified time if the user has not performed any interaction within the specified time interval.
 * @param {() => void} callBack The callback to be debounced.
 * @param {number} timeOut The debounce time in milliseconds.
 * @param {() => boolean} postpone A function that returns true if the callback should be postponed.
 * @param {React.DependencyList} deps Additional dependencies for the effect.
 */
const useUserIdleDebounce = (
    callBack: () => void | Promise<void>,
    timeOut: number,
    postpone?: () => boolean,
    deps?: React.DependencyList
) => {
    const [interactionOccurred, setInteractionOccurred] = React.useState<Date>(new Date());

    const idleDebounce = React.useCallback(() => {
        void callBack();
    }, [callBack]);

    const useInteraction = React.useCallback(() => {
        setInteractionOccurred(new Date());
    }, []);

    React.useEffect(() => {
        window.addEventListener("mousemove", useInteraction);
        window.addEventListener("mousedown", useInteraction);
        window.addEventListener("mouseup", useInteraction);
        window.addEventListener("mousewheel", useInteraction);
        window.addEventListener("keydown", useInteraction);
        window.addEventListener("keyup", useInteraction);
        window.addEventListener("keypress", useInteraction);
        return () => {
            window.removeEventListener("mousemove", useInteraction);
            window.removeEventListener("mousedown", useInteraction);
            window.removeEventListener("mouseup", useInteraction);
            window.removeEventListener("mousewheel", useInteraction);
            window.removeEventListener("keydown", useInteraction);
            window.removeEventListener("keyup", useInteraction);
            window.removeEventListener("keypress", useInteraction);
        };
    }, [useInteraction]);

    useDebounce(idleDebounce, timeOut, postpone, [...(deps ?? []), interactionOccurred]);
};

export { useDebounce, useUserIdleDebounce };
