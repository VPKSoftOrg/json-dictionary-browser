import * as React from "react";
import "./App.css";
import { faEdit, faFile, faMoon, faSun } from "@fortawesome/free-regular-svg-icons";
import { faDownload, faInfo, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input, Switch, Table, Tooltip } from "antd";
import type { Key } from "antd/es/table/interface";
import classNames from "classnames";
import Fuse from "fuse.js";
import styled from "styled-components";
import { DragDropOpenFileAreaButton } from "./Components/DragDropOpenFileArea.tsx";
import { useAntdTheme, useAntdToken } from "./Context/AntdThemeContext.tsx";
import { useNotify } from "./Hooks/Notify.ts";
import { useDynamicDownload } from "./Hooks/UseDynamicDownload.ts";
import { AboutPopup } from "./Popups/AboutPopup.tsx";
import { AddEditRowDataPopup } from "./Popups/AddEditRowDataPopup.tsx";
import { FieldSelectPopup } from "./Popups/FieldSelectPopup.tsx";
import { PwaBadge } from "./PwaBadge.tsx";
import type { BaseProps, DictionaryEntry } from "./Types/BaseTypes.ts";
import { getArrayFields } from "./Utilities/ArrayUtils.ts";
import { useLocalStorage } from "./Utilities/UseLocalStorage.tsx";

type Props = {} & BaseProps;

let App = ({ className }: Props) => {
    // Local storage
    const [setItem, , getItem] = useLocalStorage();

    // Antd theme selection design token
    const { token } = useAntdToken();

    // Pure state
    const [dataSource, setDataSource] = React.useState<DictionaryEntry[]>();
    const { setTheme, updateBackground } = useAntdTheme();
    const [selectKeysVisible, setSelectKeysVisible] = React.useState(false);
    const [scrollHeight, setScrollHeight] = React.useState(0);
    const [addNew, setAddNew] = React.useState(false);
    const [addOrEditEntryVisible, setAddOrEditEntryVisible] = React.useState(false);
    const [editAddEntry, setEditAddEntry] = React.useState<DictionaryEntry | undefined>(undefined);
    const [editEntryNewMode, setEditEntryNewMode] = React.useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = React.useState<Array<Key>>([]);
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);

    // Persistent state
    const [keys, setKeys] = React.useState<Array<string>>(getItem<Array<string>>("keys", []));
    const [darkMode, setDarkMode] = React.useState<boolean>(getItem<boolean>("darkMode", false));
    const [dictionary, setDictionary] = React.useState<DictionaryEntry[]>(getItem<DictionaryEntry[]>("dictionary", []));

    // Ref data not interacting with the UI
    const dictionaryTempRef = React.useRef<DictionaryEntry[] | undefined>(undefined);
    const keysTempRef = React.useRef<Array<string>>([]);

    // The area where the notifications go
    const [contextHolder, notification] = useNotify();

    // Download the current dictionary
    const downloadLinkClick = useDynamicDownload(dictionary);

    const downloadClick = React.useCallback(() => {
        downloadLinkClick();
    }, [downloadLinkClick]);

    React.useEffect(() => {
        setTheme?.(darkMode ? "dark" : "light");
        updateBackground?.(token);
    }, [darkMode, setTheme, updateBackground, token]);

    React.useEffect(() => {
        setItem("darkMode", darkMode);
    }, [darkMode, setItem]);

    const fuse = React.useMemo(() => {
        const fuse = new Fuse(dictionary, {
            keys: [...keys],
            includeScore: true,
        });
        return fuse;
    }, [dictionary, keys]);

    const onGetFile = React.useCallback(
        async (file: File) => {
            const data = file;
            let parsed: unknown[] | undefined;
            try {
                const text = await data.text();
                parsed = JSON.parse(text);
            } catch (e) {
                notification("error", `Error opening the file: '${e}'.`);
                return;
            }
            if (!parsed) {
                notification("error", "The file is empty.");
                return;
            }
            if (!Array.isArray(parsed)) {
                notification("error", "The contents must be a JSON array.");
                return;
            }

            let dictionary = parsed as DictionaryEntry[];
            dictionary = dictionary.map((f, i) => ({ ...f, id: i })) as DictionaryEntry[];
            dictionaryTempRef.current = parsed as DictionaryEntry[];
            keysTempRef.current = getArrayFields(dictionary);
            setSelectKeysVisible(true);
        },
        [notification]
    );

    const tableColumns = React.useMemo(() => {
        return keys.map(key => ({
            title: key[0].toUpperCase() + key.slice(1),
            dataIndex: key,
            key: key,
        }));
    }, [keys]);

    const onSearch = React.useCallback(
        (value: string) => {
            if (value.trim() === "") {
                setDataSource(dictionary);
                return;
            }
            let result = fuse.search(value);
            result = result.filter(({ score }) => score ?? 1 < 0.3).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
            // Take only ten first from the results
            result = result.slice(0, 10);
            setDataSource(result.map(({ item }) => item));
        },
        [fuse, dictionary]
    );

    const onLightDarkSwitchChangeEventHandler = React.useCallback((checked: boolean) => {
        setDarkMode(checked);
    }, []);

    const onSelectKeysClose = React.useCallback(
        (accept: boolean, fields?: Array<string>) => {
            if (accept && addNew) {
                dictionaryTempRef.current = undefined;
                setKeys(fields ?? []);
                setSelectKeysVisible(false);
                setDictionary([]);
                setItem("dictionary", []);
                setItem("keys", fields ?? []);
            } else if (accept && dictionaryTempRef.current) {
                setKeys(fields ?? []);
                setSelectKeysVisible(false);
                setDictionary(dictionaryTempRef.current);
                const newDictionary = [...dictionaryTempRef.current];
                // Select the keys which are not in the fields but exists in the keysTempRef
                const newKeys = keysTempRef.current.filter(key => !fields?.includes(key));

                for (const key of newKeys) {
                    if (key === "id") {
                        continue;
                    }
                    for (const item of newDictionary) {
                        delete item[key];
                    }
                }
                setDictionary(newDictionary);
                setItem("dictionary", newDictionary);
                setItem("keys", fields ?? []);
            } else {
                dictionaryTempRef.current = undefined;
                keysTempRef.current = [];
                setSelectKeysVisible(false);
            }
        },
        [setItem, addNew]
    );

    const onAddEditRowDataPopupClose = React.useCallback(
        (accept: boolean, data?: DictionaryEntry) => {
            if (accept && data) {
                let newDictionary = [...dictionary];
                if (editEntryNewMode) {
                    newDictionary.push(data);
                } else if (editAddEntry && !editEntryNewMode) {
                    const index = newDictionary.findIndex(f => f.id === editAddEntry.id);
                    newDictionary[index] = data;
                }
                setDictionary(newDictionary);
                setItem("dictionary", newDictionary);
            }
            setAddOrEditEntryVisible(false);
        },
        [setItem, dictionary, editAddEntry, editEntryNewMode]
    );

    // The Antd table scroll height must be calculated dynamically as it doesn't support max-height
    const onResize = React.useCallback(() => {
        const tableContainer = document.getElementById("table-container");
        const tableHeader = document.getElementsByClassName("ant-table-header")?.[0] as HTMLElement | undefined;
        const clientHeight = tableContainer?.clientHeight ?? 0;
        const headerHeight = tableHeader?.offsetHeight ?? 0;
        const totalHeight = clientHeight - headerHeight - 20;
        setScrollHeight(totalHeight);
    }, []);

    React.useEffect(() => {
        globalThis.addEventListener("resize", onResize);
        return () => {
            globalThis.removeEventListener("resize", onResize);
        };
    }, [onResize]);

    const addNewClick = React.useCallback(() => {
        setAddNew(true);
        setSelectKeysVisible(true);
    }, []);

    const addClick = React.useCallback(() => {
        setEditEntryNewMode(true);
        setAddOrEditEntryVisible(true);
    }, []);

    const editClick = React.useCallback(() => {
        if (selectedRowKeys.length > 0) {
            const lastSelectedKey = selectedRowKeys[selectedRowKeys.length - 1];
            setEditAddEntry(dictionary.find(item => item.id === lastSelectedKey));

            setEditEntryNewMode(false);
            setAddOrEditEntryVisible(true);
        }
    }, [selectedRowKeys, dictionary]);

    const onSelectionChange = React.useCallback((selectedRowKeys: Array<Key>) => {
        setSelectedRowKeys(selectedRowKeys);
    }, []);

    const rowSelection = React.useMemo(() => {
        return {
            onChange: onSelectionChange,
            columnWidth: 60,
            columnTitle: "Select",
        };
    }, [onSelectionChange]);

    const showAboutClick = React.useCallback(() => {
        setAboutPopupVisible(true);
    }, []);

    React.useEffect(() => {
        const timeout = globalThis.setTimeout(onResize, 1000);
        return () => {
            globalThis.clearTimeout(timeout);
        };
    }, [onResize]);

    return (
        <div id="App" className={classNames(className, App.name)}>
            {contextHolder}
            <div className="App-toolbar">
                <DragDropOpenFileAreaButton //
                    onGetFile={onGetFile}
                />
                <Input.Search //
                    id="app-toolbar-search"
                    placeholder="Search"
                    onSearch={onSearch}
                    className="App-toolbar-search"
                />
                <Tooltip title="Save the dictionary">
                    <Button //
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        onClick={downloadClick}
                        className="Toolbar-button"
                    />
                </Tooltip>
                <Switch
                    className="App-toolbar-switch"
                    checkedChildren={<FontAwesomeIcon icon={faMoon} />}
                    unCheckedChildren={<FontAwesomeIcon icon={faSun} />}
                    defaultChecked
                    checked={darkMode}
                    onChange={onLightDarkSwitchChangeEventHandler}
                />
                <Tooltip title="About">
                    <Button //
                        icon={<FontAwesomeIcon icon={faInfo} />}
                        onClick={showAboutClick}
                        className="Toolbar-button"
                    />
                </Tooltip>
            </div>
            <div className="App-toolbar">
                <Tooltip title="New dictionary">
                    <Button //
                        icon={<FontAwesomeIcon icon={faFile} />}
                        onClick={addNewClick}
                        className="Toolbar-button"
                    >
                        New dictionary
                    </Button>
                </Tooltip>
                <Tooltip title="Add new entry">
                    <Button //
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={addClick}
                        className="Toolbar-button"
                    >
                        Add new entry
                    </Button>
                </Tooltip>
                <Tooltip title="Edit selected entry">
                    <Button //
                        icon={<FontAwesomeIcon icon={faEdit} />}
                        onClick={editClick}
                        className="Toolbar-button"
                        disabled={selectedRowKeys.length === 0}
                    >
                        Edit selected entry
                    </Button>
                </Tooltip>
            </div>
            <div id="table-container" className="App-table-container">
                <Table<DictionaryEntry> //
                    id="table-fixed-height"
                    className="App-table"
                    columns={tableColumns}
                    dataSource={dataSource ?? dictionary}
                    pagination={false}
                    virtual
                    scroll={{ y: scrollHeight }}
                    rowKey="id"
                    rowSelection={rowSelection}
                />
            </div>
            {selectKeysVisible && (
                <FieldSelectPopup //
                    visible={selectKeysVisible}
                    allFields={addNew ? defaultNewFields : keysTempRef.current}
                    onClose={onSelectKeysClose}
                    addNew={addNew}
                />
            )}

            <AddEditRowDataPopup //
                visible={addOrEditEntryVisible}
                currentDictionary={dictionary}
                fields={keys}
                onClose={onAddEditRowDataPopupClose}
                editAddEntry={editEntryNewMode ? undefined : editAddEntry}
            />

            <AboutPopup //
                visible={aboutPopupVisible}
                onClose={() => setAboutPopupVisible(false)}
                darkMode={darkMode}
            />

            <PwaBadge />
        </div>
    );
};

const defaultNewFields = ["name", "value"];

App = styled(App)`
    display: flex;
    flex-direction: column;
    height: 100vh;
    .App-table {
        height: 100%;
        margin: 10px;
    }
    .App-toolbar {
        margin-top: 10px;
        margin-left: 10px;
        margin-right: 10px;
        display: flex;
        flex-direction: row;
        gap: 10px;
        flex-wrap: wrap;
    }
    .App-toolbar-switch {
        align-self: center;
    }
    .App-table-container {
        height: 100%;
        overflow: hidden;
    }
    .Toolbar-button {
        min-width: 40px;
    }
    .App-toolbar-search {
        width: 300px;
    }
`;

export { App };
