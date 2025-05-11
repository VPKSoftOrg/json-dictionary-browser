import { Button, type ButtonProps } from "antd";
import classNames from "classnames";
import * as React from "react";
import styled from "styled-components";
import { omitFields } from "../Utilities/Objects";

type DropButtonProps = ButtonProps & {
    canDrop?: boolean;
};

let StyledButton = (props: DropButtonProps) => {
    // biome-ignore lint/correctness/noUnusedVariables: the canDrop prop is not used by the Button component
    const { canDrop, ...restProps } = props;
    return <Button {...restProps} />;
};

StyledButton = styled(StyledButton)`
    cursor: ${props => (props.canDrop ? "pointer" : "not-allowed")}; 
`;

type DragDropOpenFileAreaProps = {
    onGetFile: (file: File) => void;
} & ButtonProps;

let DragDropOpenFileAreaButton = (props: DragDropOpenFileAreaProps) => {
    const [canDrop, setCanDrop] = React.useState(true);
    const onDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.items.length === 1) {
            if (e.dataTransfer.items[0].kind === "file") {
                if (e.dataTransfer.items[0].type === "application/json") {
                    setCanDrop(true);
                    e.dataTransfer.effectAllowed = "copy";
                }
            }
        } else if (e.dataTransfer.items.length === 0) {
            setCanDrop(true);
            e.dataTransfer.effectAllowed = "copy";
        } else {
            setCanDrop(false);
            e.dataTransfer.effectAllowed = "none";
            e.stopPropagation();
        }
    }, []);

    const onDrop = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.items[0].getAsFile();
            if (file) {
                props.onGetFile(file);
            }
        },
        [props.onGetFile]
    );

    const onButtonClick = React.useCallback(async () => {
        const file = await globalThis.showOpenFilePicker(pickerOpts);
        const data = await file[0].getFile();
        if (data.name.endsWith(".json")) {
            props.onGetFile(data);
        }
    }, [props.onGetFile]);

    const buttonProps = React.useMemo(() => omitFields(props, ["onGetFile"]), [props]);

    return (
        <StyledButton
            {...buttonProps}
            canDrop={canDrop}
            disabled={!canDrop}
            className={classNames(DragDropOpenFileAreaButton.name, props.className)}
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDrop={onDrop}
            onClick={onButtonClick}
        >
            Drag & Drop a JSON file here or click to open
        </StyledButton>
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
