import * as React from "react";
import "./App.css";
import { faEdit, faFile, faMoon, faSun } from "@fortawesome/free-regular-svg-icons";
import { faDownload, faInfo, faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Empty, Input, Modal, Switch, Table, Tabs, Tooltip } from "antd";
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
import { DictionaryNamePopup } from "./Popups/DictionaryNamePopup.tsx";
import { FieldSelectPopup } from "./Popups/FieldSelectPopup.tsx";
import { PwaBadge } from "./PwaBadge.tsx";
import type { BaseProps, DictionaryEntry, DictionaryTab } from "./Types/BaseTypes.ts";
import {
    activeKeyAfterClose,
    createDictionaryTab,
    dictionaryNameToFileName,
    fileNameToDictionaryName,
    keepSelectedFields,
    loadDictionaryTabs,
    newDictionaryName,
    parseDictionaryJson,
    searchDictionary,
} from "./Utilities/DictionaryUtils.ts";
import { pascalCase } from "./Utilities/Misc.ts";
import { useLocalStorage } from "./Utilities/UseLocalStorage.tsx";

type Props = {} & BaseProps;

let App = ({ className }: Props) => {
    // The area where the notifications go
    const [contextHolder, notification] = useNotify();

    // The confirmation dialogs
    const [modal, modalContextHolder] = Modal.useModal();

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
    const [searchQuery, setSearchQuery] = React.useState("");
    const { setTheme, updateBackground } = useAntdTheme();
    const [selectKeysVisible, setSelectKeysVisible] = React.useState(false);
    const [scrollHeight, setScrollHeight] = React.useState(0);
    const [addNew, setAddNew] = React.useState(false);
    const [addOrEditEntryVisible, setAddOrEditEntryVisible] = React.useState(false);
    const [editAddEntry, setEditAddEntry] = React.useState<DictionaryEntry | undefined>(undefined);
    const [editEntryNewMode, setEditEntryNewMode] = React.useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = React.useState<Array<Key>>([]);
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [renameKey, setRenameKey] = React.useState<string | undefined>(undefined);
    const [newDictionaryNameValue, setNewDictionaryNameValue] = React.useState("");

    // Persistent state
    const [darkMode, setDarkMode] = React.useState<boolean>(getItem<boolean>("darkMode", false));
    const [dictionaries, setDictionaries] = React.useState<DictionaryTab[]>(() => loadDictionaryTabs(getItem));
    const [activeKey, setActiveKey] = React.useState<string | undefined>(
        () => getItem<string | null>("activeDictionary", null) ?? undefined
    );

    // Ref data not interacting with the UI
    const dictionaryTempRef = React.useRef<DictionaryEntry[] | undefined>(undefined);
    const keysTempRef = React.useRef<Array<string>>([]);

    // The currently active dictionary tab, the first one if the stored active key is not valid
    const activeTab = React.useMemo(
        () => dictionaries.find(f => f.key === activeKey) ?? dictionaries[0],
        [dictionaries, activeKey]
    );

    const dictionary = activeTab?.dictionary ?? emptyDictionary;
    const keys = activeTab?.keys ?? emptyKeys;

    // Download the current dictionary
    const downloadLinkClick = useDynamicDownload(dictionary, dictionaryNameToFileName(activeTab?.name));

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

    // Sets the dictionary tabs and saves them into the local storage
    const updateDictionaries = React.useCallback(
        (newDictionaries: DictionaryTab[]) => {
            setDictionaries(newDictionaries);
            setItem("dictionaries", newDictionaries);
        },
        [setItem]
    );

    // Sets the active dictionary tab, saves it into the local storage and resets the tab-specific UI state
    const activateTab = React.useCallback(
        (key: string | undefined) => {
            setActiveKey(key);
            setItem("activeDictionary", key ?? null);
            setSearchText("");
            setSearchQuery("");
            setSelectedRowKeys([]);
        },
        [setItem]
    );

    // Replaces the entries of the active dictionary
    const updateActiveDictionary = React.useCallback(
        (newDictionary: DictionaryEntry[]) => {
            if (!activeTab) {
                return;
            }
            updateDictionaries(
                dictionaries.map(f => (f.key === activeTab.key ? { ...f, dictionary: newDictionary } : f))
            );
        },
        [activeTab, dictionaries, updateDictionaries]
    );

    // Adds a new dictionary tab and activates it
    const addDictionaryTab = React.useCallback(
        (tab: DictionaryTab) => {
            updateDictionaries([...dictionaries, tab]);
            activateTab(tab.key);
        },
        [dictionaries, updateDictionaries, activateTab]
    );

    const fuse = React.useMemo(() => {
        const fuse = new Fuse(dictionary, {
            keys: [...keys],
            includeScore: true,
        });
        return fuse;
    }, [dictionary, keys]);

    const onGetFile = React.useCallback(
        async (file: File) => {
            let text: string;
            try {
                text = await file.text();
            } catch (e) {
                notification("error", `Error opening the file: '${e}'.`);
                return;
            }

            const result = parseDictionaryJson(text);
            if (!result.success) {
                notification("error", result.error);
                return;
            }

            dictionaryTempRef.current = result.dictionary;
            keysTempRef.current = result.fields;
            setNewDictionaryNameValue(fileNameToDictionaryName(file.name));
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
    const dataSource = React.useMemo(
        () => searchDictionary(fuse, searchQuery) ?? dictionary,
        [fuse, dictionary, searchQuery]
    );

    const onSearch = React.useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    const onSearchTextChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    }, []);

    const onLightDarkSwitchChangeEventHandler = React.useCallback((checked: boolean) => {
        setDarkMode(checked);
    }, []);

    const onSelectKeysClose = React.useCallback(
        (accept: boolean, fields?: Array<string>, name?: string) => {
            if (accept && addNew) {
                addDictionaryTab(createDictionaryTab(name ?? "", [], fields ?? []));
            } else if (accept && dictionaryTempRef.current) {
                const newDictionary = keepSelectedFields(dictionaryTempRef.current, fields ?? []);
                addDictionaryTab(createDictionaryTab(name ?? "", newDictionary, fields ?? []));
            }

            dictionaryTempRef.current = undefined;
            keysTempRef.current = [];
            setSelectKeysVisible(false);
            setAddNew(false);
        },
        [addNew, addDictionaryTab]
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
                updateActiveDictionary(newDictionary);
            }
            setAddOrEditEntryVisible(false);
        },
        [dictionary, editAddEntry, editEntryNewMode, notification, updateActiveDictionary]
    );

    // The Antd table scroll height must be calculated dynamically as it doesn't support max-height.
    // A ResizeObserver catches every size change (window resize, toolbar wrapping, header changes).
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const activeTabKey = activeTab?.key;

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-observe the header when the columns (keys) or the table (tab) change
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
    }, [keys, activeTabKey]);

    const addNewClick = React.useCallback(() => {
        setNewDictionaryNameValue(newDictionaryName(dictionaries.map(f => f.name)));
        setAddNew(true);
        setSelectKeysVisible(true);
    }, [dictionaries]);

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

    const closeTab = React.useCallback(
        (key: string) => {
            const tab = dictionaries.find(f => f.key === key);
            if (!tab) {
                return;
            }
            void modal.confirm({
                title: "Close dictionary",
                content: `Close the dictionary '${tab.name}'? Its data will be removed from the browser. Save it first if you want to keep it.`,
                okText: "Close",
                okButtonProps: { danger: true },
                onOk: () => {
                    activateTab(activeKeyAfterClose(dictionaries, key, activeTab?.key));
                    updateDictionaries(dictionaries.filter(f => f.key !== key));
                },
            });
        },
        [dictionaries, activeTab, modal, activateTab, updateDictionaries]
    );

    const onTabEdit = React.useCallback(
        (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: "add" | "remove") => {
            if (action === "add") {
                addNewClick();
            } else if (typeof targetKey === "string") {
                closeTab(targetKey);
            }
        },
        [addNewClick, closeTab]
    );

    const renameClick = React.useCallback(() => {
        setRenameKey(activeTab?.key);
    }, [activeTab]);

    const onRenamePopupClose = React.useCallback(
        (accept: boolean, name?: string) => {
            if (accept && name && renameKey) {
                updateDictionaries(dictionaries.map(f => (f.key === renameKey ? { ...f, name } : f)));
            }
            setRenameKey(undefined);
        },
        [renameKey, dictionaries, updateDictionaries]
    );

    const tabItems = React.useMemo(() => {
        return dictionaries.map(f => ({
            key: f.key,
            label: (
                <Tooltip title="Double-click to rename" mouseEnterDelay={1}>
                    <span onDoubleClick={() => setRenameKey(f.key)}>{f.name}</span>
                </Tooltip>
            ),
            closable: true,
        }));
    }, [dictionaries]);

    const renameTab = dictionaries.find(f => f.key === renameKey);

    return (
        <div id="App" className={classNames(className, App.name)}>
            {contextHolder}
            {modalContextHolder}
            <div className="App-toolbar">
                <DragDropOpenFileAreaButton //
                    onGetFile={onGetFile}
                    onOpenError={onOpenFileError}
                />
                <Input.Search //
                    id="app-toolbar-search"
                    placeholder="Search"
                    value={searchText}
                    onChange={onSearchTextChange}
                    onSearch={onSearch}
                    className="App-toolbar-search"
                    disabled={!activeTab}
                />
                <Tooltip title="Save the dictionary">
                    <Button //
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        onClick={downloadClick}
                        className="Toolbar-button"
                        disabled={!activeTab}
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
                <Tooltip title="Rename dictionary">
                    <Button //
                        icon={<FontAwesomeIcon icon={faPen} />}
                        onClick={renameClick}
                        className="Toolbar-button"
                        disabled={!activeTab}
                    >
                        Rename dictionary
                    </Button>
                </Tooltip>
                <Tooltip title="Add new entry">
                    <Button //
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={addClick}
                        className="Toolbar-button"
                        disabled={!activeTab}
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
            <Tabs //
                className="App-tabs"
                type="editable-card"
                size="small"
                activeKey={activeTab?.key}
                items={tabItems}
                onChange={activateTab}
                onEdit={onTabEdit}
                addIcon={
                    <Tooltip title="New dictionary">
                        <FontAwesomeIcon icon={faPlus} />
                    </Tooltip>
                }
            />
            <div id="table-container" ref={tableContainerRef} className="App-table-container">
                {activeTab ? (
                    <Table<DictionaryEntry> //
                        key={activeTab.key}
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
                ) : (
                    <Empty //
                        className="App-empty"
                        description="No dictionaries open. Open a JSON file or create a new dictionary."
                    />
                )}
            </div>
            {selectKeysVisible && (
                <FieldSelectPopup //
                    visible={selectKeysVisible}
                    allFields={addNew ? defaultNewFields : keysTempRef.current}
                    initialName={newDictionaryNameValue}
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

            <DictionaryNamePopup //
                visible={renameTab !== undefined}
                name={renameTab?.name ?? ""}
                onClose={onRenamePopupClose}
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
const emptyDictionary: DictionaryEntry[] = [];
const emptyKeys: Array<string> = [];

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
    .App-tabs {
        margin-top: 10px;
        margin-left: 10px;
        margin-right: 10px;
    }
    .App-tabs .ant-tabs-nav {
        margin-bottom: 0;
    }
    .App-tabs .ant-tabs-tab {
        user-select: none;
    }
    .App-table-container {
        flex: 1;
        min-height: 0;
        overflow: hidden;
    }
    .App-empty {
        margin-top: 40px;
    }
    .Toolbar-button {
        min-width: 40px;
    }
    .App-toolbar-search {
        width: 300px;
    }
`;

export { App };
