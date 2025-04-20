import { Modal, Select } from "antd";
import classNames from "classnames";
import * as React from "react";
import { styled } from "styled-components";

/**
 * The props for the {@link PreferencesPopup} component.
 */
type ServerPreferencesPopupProps = {
    /** The class name for the component. */
    className?: string;
    /** A value indicating whether this popup is visible. */
    visible: boolean;
    /** An array of all available fields. */
    allFields: Array<string>;
    /** A value indicating whether a new fields can be added. */
    addNew: boolean;
    /** A callback function to be called when the popup is closed. */
    onClose: (accept: boolean, fields?: Array<string>) => void;
};

/**
 * A component to set the application preferences.
 * @param param0 The component props: {@link ServerPreferencesPopupProps}.
 * @returns A component.
 */
let FieldSelectPopup = ({
    className, //
    visible,
    allFields,
    addNew,
    onClose,
}: ServerPreferencesPopupProps) => {
    const [fields, setFields] = React.useState<Array<string>>([]);

    React.useEffect(() => {
        setFields(allFields.filter(f => f !== "id"));
    }, [allFields]);

    const onOkClick = React.useCallback(() => {
        onClose(true, fields);
    }, [fields, onClose]);

    const onCancel = React.useCallback(() => {
        onClose(false);
    }, [onClose]);

    const selectChange = React.useCallback((value: string[]) => {
        const newValue = value.map(f => f.toLowerCase());
        setFields(newValue);
    }, []);

    const selectOptions = React.useMemo(() => {
        const result = allFields
            .filter(f => f !== "id")
            .map((f, i) => (
                <Select.Option value={f} key={i}>
                    {`${f[0].toUpperCase()}${f.slice(1)}`}
                </Select.Option>
            ));
        return result;
    }, [allFields]);

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
            <div className={classNames(FieldSelectPopup.name, className)}>
                <table className={classNames(FieldSelectPopup.name, className)}>
                    <tbody>
                        <tr>
                            <td>
                                <div>Data fields</div>
                            </td>
                            <td>
                                <Select //
                                    value={fields}
                                    mode={addNew ? "tags" : "multiple"}
                                    onChange={selectChange}
                                    className="Select-width"
                                >
                                    {selectOptions}
                                </Select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

FieldSelectPopup = styled(FieldSelectPopup)`
    display: flex;
    flex-direction: column;
    height: 100%;
    .Select-width {
        width: 450px;
    }
`;

export { FieldSelectPopup };
