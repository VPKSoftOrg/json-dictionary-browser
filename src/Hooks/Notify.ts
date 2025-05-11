import { notification } from "antd";
import * as React from "react";

/**
 * Notification types for the {@link useNotify} hook.
 */
type NotificationType = "success" | "info" | "warning" | "error";

/**
 * A custom hook for antd notifications.
 * @returns A context holder for the notifications to be embedded into the JSX and a callback to display notifications.
 */
const useNotify = (): [
    React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>,
    (type: NotificationType, title: string | null | undefined | Error, duration?: number) => void,
] => {
    const [api, contextHolder] = notification.useNotification();

    const openNotificationWithIcon = React.useCallback(
        (type: NotificationType, title: string | null | undefined | Error, duration?: number) => {
            api[type]({
                message: title instanceof Error ? title?.toString() : title,
                duration: duration ?? 5,
            });
        },
        [api]
    );

    return [contextHolder, openNotificationWithIcon];
};

export { useNotify };
export type { NotificationType };
