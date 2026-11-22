import { Button } from "antd";
import React from "react";
import "./PwaBadge.css";

import { useRegisterSW } from "virtual:pwa-register/react";
import { useAntdToken } from "./Context/AntdThemeContext.tsx";

// Check for updates every hour
const updateCheckPeriod = 60 * 60 * 1000;

type Registration = {
    swUrl: string;
    registration: ServiceWorkerRegistration;
};

const PwaBadge = () => {
    const { token } = useAntdToken();
    const [registration, setRegistration] = React.useState<Registration | null>(null);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, r) {
            if (r) {
                setRegistration({ swUrl, registration: r });
            }
        },
    });

    // Periodically check for a new service worker. The interval is cleared on unmount and
    // the check works whatever state (installing, waiting, active) the registration was in.
    React.useEffect(() => {
        if (!registration || updateCheckPeriod <= 0) {
            return;
        }

        const interval = globalThis.setInterval(() => {
            void checkForUpdate(registration);
        }, updateCheckPeriod);

        return () => {
            globalThis.clearInterval(interval);
        };
    }, [registration]);

    const close = React.useCallback(() => {
        setNeedRefresh(false);
    }, [setNeedRefresh]);

    const reload = React.useCallback(async () => {
        const waiting = (await navigator.serviceWorker.getRegistration())?.waiting;
        if (!waiting) {
            // The new version is already active (e.g. it was activated from another tab)
            globalThis.location.reload();
            return;
        }

        // workbox-window only reloads when the page was already controlled when the service worker
        // was registered. On the first visit that isn't the case (clientsClaim takes control later),
        // so the new worker activated but the page never reloaded. Reload on the controller change here.
        navigator.serviceWorker.addEventListener("controllerchange", () => globalThis.location.reload(), {
            once: true,
        });
        await updateServiceWorker(true);
    }, [updateServiceWorker]);

    return (
        <div className="PWABadge" role="alert" aria-labelledby="toast-message">
            {needRefresh && (
                <div
                    className="PWABadge-toast"
                    style={{
                        backgroundColor: token.colorBgElevated,
                        color: token.colorText,
                        borderColor: token.colorBorder,
                    }}
                >
                    <div className="PWABadge-message">
                        <span id="toast-message">New content available, click on reload button to update.</span>
                    </div>
                    <div className="PWABadge-buttons">
                        <Button type="primary" size="small" onClick={() => void reload()}>
                            Reload
                        </Button>
                        <Button size="small" onClick={close}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Checks whether a new service worker is available. Errors (e.g. a lost connection) are ignored;
 * the next periodic check tries again.
 */
const checkForUpdate = async ({ swUrl, registration }: Registration) => {
    // Don't check while a new service worker is already being installed
    if (registration.installing) {
        return;
    }

    if ("onLine" in navigator && !navigator.onLine) {
        return;
    }

    try {
        const resp = await fetch(swUrl, {
            cache: "no-store",
            headers: {
                cache: "no-store",
                "cache-control": "no-cache",
            },
        });

        if (resp.status === 200) {
            await registration.update();
        }
    } catch {
        // Offline or the server is unreachable; try again on the next check
    }
};

export { PwaBadge };
