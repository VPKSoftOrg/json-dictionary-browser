import * as React from "react";

/**
 * A custom hook that prepares a JSON data download link.
 *
 * @param data - The data to be converted into a JSON file for download.
 * @param fileName - The name of the downloaded file. Defaults to "data.json".
 * @returns A function that triggers the download of the JSON file.
 *
 * This hook memoizes a Blob and a single object URL for the provided data, creates an anchor element
 * configured to download the data as a JSON file with the given file name, and appends it to the document body.
 * The element is removed from the document and the URL is revoked when the effect cleans up.
 */

const useDynamicDownload = (data: unknown, fileName = "data.json") => {
    const blob = React.useMemo(() => new Blob([JSON.stringify(data)], { type: "application/json" }), [data]);

    const [element, setElement] = React.useState<HTMLAnchorElement | null>(null);

    // Create the object URL inside the effect so every URL created is also revoked
    React.useEffect(() => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        setElement(a);

        return () => {
            a.remove();
            URL.revokeObjectURL(url);
        };
    }, [blob, fileName]);

    const triggerDownload = React.useCallback(() => {
        element?.click();
    }, [element]);

    return triggerDownload;
};

export { useDynamicDownload };
