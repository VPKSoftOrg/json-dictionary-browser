import { Input, Modal } from "antd";
import classNames from "classnames";
import * as React from "react";
import styled from "styled-components";
import type { DictionaryEntry } from "../Types/BaseTypes";
import { pascalCase } from "../Utilities/Misc";

/**
 * The props for the {@link PreferencesPopup} component.
 */
type AddEditRowDataPopupProps = {
    /** The class name for the component. */
    className?: string;
    /** An array of field names in the data entry. */
    fields: Array<string>;
    /** A value indicating whether this popup is visible. */
    visible: boolean;
    /** The data entry to edit or add. */
    editAddEntry: DictionaryEntry | undefined;
    /** The current dictionary. */
    currentDictionary: DictionaryEntry[];
    /** A function to close this popup. */
    onClose: (accept: boolean, entry?: DictionaryEntry) => void;
};

let AddEditRowDataPopup = ({
    className, //
    fields,
    visible,
    editAddEntry,
    currentDictionary,
    onClose,
}: AddEditRowDataPopupProps) => {
    const [editAddEntryInternal, setEditAddEntryInternal] = React.useState<DictionaryEntry | undefined>();

    React.useEffect(() => {
        if (editAddEntry) {
            setEditAddEntryInternal(editAddEntry);
        } else {
            const newEntry = createEmptyEntry(fields, currentDictionary);
            setEditAddEntryInternal(newEntry);
        }
    }, [editAddEntry, fields, currentDictionary]);

    const onOkClick = React.useCallback(() => {
        onClose(true, editAddEntryInternal);
    }, [onClose, editAddEntryInternal]);

    const onCancel = React.useCallback(() => {
        onClose(false);
    }, [onClose]);

    const editValues = React.useMemo(() => {
        if (!editAddEntryInternal) {
            return null;
        }

        const result = fields.map(f => (
            <tr key={f}>
                <td>{pascalCase(f)}</td>
                <td>
                    <Input
                        type="text"
                        value={editAddEntryInternal?.[f] || ""}
                        onChange={e => setEditAddEntryInternal({ ...editAddEntryInternal, [f]: e.target.value })}
                    />
                </td>
            </tr>
        ));
        return result;
    }, [fields, editAddEntryInternal]);

    return (
        <Modal //
            title="Select fields"
            open={visible}
            width={600}
            centered
            onCancel={onCancel}
            onOk={onOkClick}
            keyboard
            maskClosable={false}
            okButtonProps={{ disabled: fields.length === 0 }}
            closable={false}
        >
            <table className={classNames(AddEditRowDataPopup.name, className)}>
                <tbody>{editValues}</tbody>
            </table>
        </Modal>
    );
};

const createEmptyEntry = (fields: Array<string>, currentDictionary: Array<DictionaryEntry>) => {
    const result = {} as DictionaryEntry;
    for (const field of fields) {
        result[field] = "";
    }

    let max = currentDictionary.map(d => d.id).reduce((a, b) => Math.max(a, b), 0) + 1;

    result["id"] = max;
    return result;
};

AddEditRowDataPopup = styled(AddEditRowDataPopup)`
    display: flex;
    flex-direction: column;
    height: 100%;
    .Select-width {
        width: 450px;
    }
`;

export { AddEditRowDataPopup };
