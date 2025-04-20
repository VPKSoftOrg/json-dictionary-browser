import * as React from "react";

/**
 * A custom hook that prepares a JSON data download link.
 *
 * @param data - The data to be converted into a JSON file for download.
 * @returns A function that triggers the download of the JSON file.
 *
 * This hook memoizes a Blob and a URL for the provided data, creates an anchor element
 * configured to download the data as a JSON file named "data.json", and appends it to the document body.
 * The element is removed from the document and the URL is revoked when the effect cleans up.
 */

const useDynamicDownload = (data: unknown) => {
    const blob = React.useMemo(() => new Blob([JSON.stringify(data)], { type: "application/json" }), [data]);
    const url = React.useMemo(() => URL.createObjectURL(blob), [blob]);
    const element = React.useMemo(() => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "data.json";
        return a;
    }, [blob]);

    React.useEffect(() => {
        document.body.appendChild(element);
        return () => {
            document.body.removeChild(element);
            URL.revokeObjectURL(url);
        };
    }, [url, element]);

    const triggerDownload = React.useCallback(() => {
        element.click();
    }, [element]);

    return triggerDownload;
};

export { useDynamicDownload };
