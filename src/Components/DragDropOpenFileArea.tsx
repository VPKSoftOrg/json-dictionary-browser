import { Button, type ButtonProps } from "antd";
import classNames from "classnames";
import * as React from "react";
import styled from "styled-components";
import { omitFields } from "../Utilities/Objects";

type DropButtonProps = ButtonProps & {
    canDrop?: boolean;
};

let StyledButton = (props: DropButtonProps) => {
    const { canDrop, ...restProps } = props;
    return <Button {...restProps} />;
};

StyledButton = styled(StyledButton)`
    cursor: ${props => (props.canDrop ? "pointer" : "not-allowed")};
`;

type DragDropOpenFileAreaProps = {
    onGetFile: (file: File) => void;
    /** Occurs when the user tries to open something that isn't a single JSON file. */
    onOpenError?: (message: string) => void;
} & ButtonProps;

const jsonMimeType = "application/json";

const isJsonFile = (file: File) => file.type === jsonMimeType || file.name.toLowerCase().endsWith(".json");

/**
 * Checks whether the dragged data can be dropped. Some platforms don't report the MIME type
 * while dragging, so an empty type is allowed here and the file is validated again on drop.
 */
const isDroppable = (dataTransfer: DataTransfer) => {
    const items = dataTransfer.items;
    if (items.length !== 1) {
        return false;
    }
    const item = items[0];
    return item.kind === "file" && (item.type === "" || item.type === jsonMimeType);
};

let DragDropOpenFileAreaButton = (props: DragDropOpenFileAreaProps) => {
    const { onGetFile, onOpenError } = props;
    const [canDrop, setCanDrop] = React.useState(true);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const onDragOver = React.useCallback((e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        const droppable = isDroppable(e.dataTransfer);
        setCanDrop(droppable);
        e.dataTransfer.dropEffect = droppable ? "copy" : "none";
    }, []);

    const onDragLeave = React.useCallback(() => {
        setCanDrop(true);
    }, []);

    const onDrop = React.useCallback(
        (e: React.DragEvent<HTMLElement>) => {
            e.preventDefault();
            setCanDrop(true);
            const files = e.dataTransfer.files;
            if (files.length !== 1 || !isJsonFile(files[0])) {
                onOpenError?.("Drop a single JSON file.");
                return;
            }
            onGetFile(files[0]);
        },
        [onGetFile, onOpenError]
    );

    const onFileInputChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            // Clear the value so selecting the same file again still fires a change event
            e.target.value = "";
            if (!file) {
                return;
            }
            if (!isJsonFile(file)) {
                onOpenError?.("Select a JSON file.");
                return;
            }
            onGetFile(file);
        },
        [onGetFile, onOpenError]
    );

    const onButtonClick = React.useCallback(async () => {
        // The File System Access API isn't available in every browser (e.g. Firefox and Safari)
        if (typeof globalThis.showOpenFilePicker !== "function") {
            fileInputRef.current?.click();
            return;
        }

        try {
            const [handle] = await globalThis.showOpenFilePicker(pickerOpts);
            const data = await handle.getFile();
            if (!isJsonFile(data)) {
                onOpenError?.("Select a JSON file.");
                return;
            }
            onGetFile(data);
        } catch (error) {
            // The user cancelled the picker
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
            onOpenError?.(`Error opening the file: '${error}'.`);
        }
    }, [onGetFile, onOpenError]);

    const buttonProps = React.useMemo(() => omitFields(props, ["onGetFile", "onOpenError"]), [props]);

    return (
        <>
            <StyledButton
                {...buttonProps}
                canDrop={canDrop}
                className={classNames(DragDropOpenFileAreaButton.name, props.className)}
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={onButtonClick}
            >
                Drag & Drop a JSON file here or click to open
            </StyledButton>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={onFileInputChange}
            />
        </>
    );
};

const pickerOpts: OpenFilePickerOptions = {
    types: [
        {
            description: "JSON Files",
            accept: {
                "application/json": [".json"],
            },
        },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
};

DragDropOpenFileAreaButton = styled(DragDropOpenFileAreaButton)`

`;

export { DragDropOpenFileAreaButton };
