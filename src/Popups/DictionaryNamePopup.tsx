import { Input, Modal } from "antd";
import classNames from "classnames";
import * as React from "react";
import { styled } from "styled-components";

/**
 * The props for the {@link DictionaryNamePopup} component.
 */
type DictionaryNamePopupProps = {
    /** The class name for the component. */
    className?: string;
    /** A value indicating whether this popup is visible. */
    visible: boolean;
    /** The current name of the dictionary. */
    name: string;
    /** A callback function to be called when the popup is closed. */
    onClose: (accept: boolean, name?: string) => void;
};

/**
 * A popup to rename a dictionary.
 * @param param0 The component props: {@link DictionaryNamePopupProps}.
 * @returns A component.
 */
let DictionaryNamePopup = ({
    className, //
    visible,
    name,
    onClose,
}: DictionaryNamePopupProps) => {
    const [nameInternal, setNameInternal] = React.useState(name);

    React.useEffect(() => {
        if (visible) {
            setNameInternal(name);
        }
    }, [name, visible]);

    const onOkClick = React.useCallback(() => {
        if (nameInternal.trim() !== "") {
            onClose(true, nameInternal.trim());
        }
    }, [nameInternal, onClose]);

    const onCancel = React.useCallback(() => {
        onClose(false);
    }, [onClose]);

    const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNameInternal(e.target.value);
    }, []);

    return (
        <Modal //
            title="Rename dictionary"
            open={visible}
            width={500}
            centered
            onCancel={onCancel}
            onOk={onOkClick}
            keyboard
            maskClosable={false}
            okButtonProps={{ disabled: nameInternal.trim() === "" }}
            closable={false}
        >
            <div className={classNames(DictionaryNamePopup.name, className)}>
                <div>Name</div>
                <Input //
                    value={nameInternal}
                    onChange={onChange}
                    onPressEnter={onOkClick}
                    autoFocus
                    aria-label="Dictionary name"
                />
            </div>
        </Modal>
    );
};

DictionaryNamePopup = styled(DictionaryNamePopup)`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
`;

export { DictionaryNamePopup };
