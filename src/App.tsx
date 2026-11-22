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
import { pascalCase } from "./Utilities/Misc.ts";
import { useLocalStorage } from "./Utilities/UseLocalStorage.tsx";

type Props = {} & BaseProps;

let App = ({ className }: Props) => {
    // The area where the notifications go
    const [contextHolder, notification] = useNotify();

    // Local storage; a failed write (e.g. the storage is full) is shown to the user
    const onStorageError = React.useCallback(
        (operation: "read" | "write", key: string) => {
            if (operation === "write") {
                notification("error", `Could not save '${key}' to the browser storage. The storage may be full.`);
            }
        },
        [notification]
    );
    const [setItem, , getItem] = useLocalStorage(onStorageError);

    // Antd theme selection design token
    const { token } = useAntdToken();

    // Pure state
    const [searchText, setSearchText] = React.useState("");
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

            // Assign sequential ids so every row has a unique key
            const dictionary = (parsed as DictionaryEntry[]).map((f, i) => ({ ...f, id: i })) as DictionaryEntry[];
            dictionaryTempRef.current = dictionary;
            keysTempRef.current = getArrayFields(dictionary);
            setAddNew(false);
            setSelectKeysVisible(true);
        },
        [notification]
    );

    const onOpenFileError = React.useCallback(
        (message: string) => {
            notification("error", message);
        },
        [notification]
    );

    const tableColumns = React.useMemo(() => {
        return keys.map(key => ({
            title: pascalCase(key),
            dataIndex: key,
            key: key,
        }));
    }, [keys]);

    // The displayed data is derived from the live dictionary so edits and newly loaded data are always shown
    const dataSource = React.useMemo(() => {
        if (searchText.trim() === "") {
            return dictionary;
        }
        return (
            fuse
                .search(searchText)
                .filter(({ score }) => (score ?? 1) < 0.3)
                .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
                // Take only ten first from the results
                .slice(0, 10)
                .map(({ item }) => item)
        );
    }, [fuse, dictionary, searchText]);

    const onSearch = React.useCallback((value: string) => {
        setSearchText(value);
    }, []);

    const onLightDarkSwitchChangeEventHandler = React.useCallback((checked: boolean) => {
        setDarkMode(checked);
    }, []);

    const onSelectKeysClose = React.useCallback(
        (accept: boolean, fields?: Array<string>) => {
            if (accept && addNew) {
                dictionaryTempRef.current = undefined;
                setKeys(fields ?? []);
                setDictionary([]);
                setSelectedRowKeys([]);
                setItem("dictionary", []);
                setItem("keys", fields ?? []);
            } else if (accept && dictionaryTempRef.current) {
                setKeys(fields ?? []);
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
                setSelectedRowKeys([]);
                setItem("dictionary", newDictionary);
                setItem("keys", fields ?? []);
            } else {
                dictionaryTempRef.current = undefined;
                keysTempRef.current = [];
            }
            setSelectKeysVisible(false);
            setAddNew(false);
        },
        [setItem, addNew]
    );

    const onAddEditRowDataPopupClose = React.useCallback(
        (accept: boolean, data?: DictionaryEntry) => {
            if (accept && data) {
                const newDictionary = [...dictionary];
                if (editEntryNewMode) {
                    newDictionary.push(data);
                } else {
                    const index = editAddEntry ? newDictionary.findIndex(f => f.id === editAddEntry.id) : -1;
                    if (index === -1) {
                        notification("error", "The edited entry no longer exists in the dictionary.");
                        setAddOrEditEntryVisible(false);
                        return;
                    }
                    newDictionary[index] = data;
                }
                setDictionary(newDictionary);
                setItem("dictionary", newDictionary);
            }
            setAddOrEditEntryVisible(false);
        },
        [setItem, dictionary, editAddEntry, editEntryNewMode, notification]
    );

    // The Antd table scroll height must be calculated dynamically as it doesn't support max-height.
    // A ResizeObserver catches every size change (window resize, toolbar wrapping, header changes).
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-observe the header when the columns (keys) change
    React.useEffect(() => {
        const tableContainer = tableContainerRef.current;
        if (!tableContainer) {
            return;
        }

        const updateScrollHeight = () => {
            const tableHeader = tableContainer.querySelector<HTMLElement>(".ant-table-header");
            const headerHeight = tableHeader?.offsetHeight ?? 0;
            setScrollHeight(Math.max(tableContainer.clientHeight - headerHeight - 20, 0));
        };

        const observer = new ResizeObserver(updateScrollHeight);
        observer.observe(tableContainer);
        const tableHeader = tableContainer.querySelector<HTMLElement>(".ant-table-header");
        if (tableHeader) {
            observer.observe(tableHeader);
        }
        updateScrollHeight();

        return () => {
            observer.disconnect();
        };
    }, [keys]);

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
            const entry = dictionary.find(item => item.id === lastSelectedKey);
            if (!entry) {
                return;
            }
            setEditAddEntry(entry);
            setEditEntryNewMode(false);
            setAddOrEditEntryVisible(true);
        }
    }, [selectedRowKeys, dictionary]);

    const onSelectionChange = React.useCallback((selectedRowKeys: Array<Key>) => {
        setSelectedRowKeys(selectedRowKeys);
    }, []);

    // Keep the selection in sync with the rows that are currently displayed
    React.useEffect(() => {
        setSelectedRowKeys(current => {
            const visibleIds = new Set<Key>(dataSource.map(item => item.id));
            const filtered = current.filter(key => visibleIds.has(key));
            return filtered.length === current.length ? current : filtered;
        });
    }, [dataSource]);

    const rowSelection = React.useMemo(() => {
        return {
            selectedRowKeys,
            onChange: onSelectionChange,
            columnWidth: 60,
            columnTitle: "Select",
        };
    }, [onSelectionChange, selectedRowKeys]);

    const showAboutClick = React.useCallback(() => {
        setAboutPopupVisible(true);
    }, []);

    return (
        <div id="App" className={classNames(className, App.name)}>
            {contextHolder}
            <div className="App-toolbar">
                <DragDropOpenFileAreaButton //
                    onGetFile={onGetFile}
                    onOpenError={onOpenFileError}
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
            <div id="table-container" ref={tableContainerRef} className="App-table-container">
                <Table<DictionaryEntry> //
                    id="table-fixed-height"
                    className="App-table"
                    columns={tableColumns}
                    dataSource={dataSource}
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
