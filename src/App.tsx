import * as React from "react";
import "./App.css";
import { faMoon, faSun } from "@fortawesome/free-regular-svg-icons";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Input, Switch, Table } from "antd";
import classNames from "classnames";
import Fuse from "fuse.js";
import styled from "styled-components";
import { DragDropOpenFileAreaButton } from "./Components/DragDropOpenFileArea.tsx";
import { FieldSelectPopup } from "./Components/FieldSelectPopup.tsx";
import { useAntdTheme, useAntdToken } from "./Context/AntdThemeContext.tsx";
import { useNotify } from "./Hooks/Notify.ts";
import { useDynamicDownload } from "./Hooks/UseDynamicDownload.ts";
import { PwaBadge } from "./PwaBadge.tsx";
import type { BaseProps, DictionaryEntry } from "./Types/BaseTypes.ts";
import { getArrayFields } from "./Utilities/ArrayUtils.ts";
import { useLocalStorage } from "./Utilities/UseLocalStorage.tsx";

type Props = {} & BaseProps;

let App = ({ className }: Props) => {
    const [setItem, , getItem] = useLocalStorage();

    const [dataSource, setDataSource] = React.useState<DictionaryEntry[]>();
    const { token } = useAntdToken();
    const { setTheme, updateBackground } = useAntdTheme();
    const [keys, setKeys] = React.useState<Array<string>>(getItem<Array<string>>("keys", []));
    const [darkMode, setDarkMode] = React.useState<boolean>(getItem<boolean>("darkMode", false));
    const [dictionary, setDictionary] = React.useState<DictionaryEntry[]>(getItem<DictionaryEntry[]>("dictionary", []));
    const [selectKeysVisible, setSelectKeysVisible] = React.useState(false);
    const [scrollHeight, setScrollHeight] = React.useState(0);

    const dictionaryTempRef = React.useRef<DictionaryEntry[] | undefined>(undefined);
    const keysTempRef = React.useRef<Array<string>>([]);

    const [contextHolder, notification] = useNotify();

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
            if (accept && dictionaryTempRef.current) {
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
        [setItem]
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
        onResize();
    }, [onResize]);

    React.useEffect(() => {
        globalThis.addEventListener("resize", onResize);
        return () => {
            globalThis.removeEventListener("resize", onResize);
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
                />
                <Button //
                    icon={<FontAwesomeIcon icon={faDownload} />}
                    onClick={downloadClick}
                />
                <Switch
                    className="App-toolbar-switch"
                    checkedChildren={<FontAwesomeIcon icon={faMoon} />}
                    unCheckedChildren={<FontAwesomeIcon icon={faSun} />}
                    defaultChecked
                    checked={darkMode}
                    onChange={onLightDarkSwitchChangeEventHandler}
                />
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
                />
            </div>
            {selectKeysVisible && (
                <FieldSelectPopup //
                    visible={selectKeysVisible}
                    allFields={keysTempRef.current}
                    onClose={onSelectKeysClose}
                />
            )}

            <PwaBadge />
        </div>
    );
};

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
    }
    .App-toolbar-switch {
        align-self: center;
    }
    .App-table-container {
        height: 100%;
        overflow: hidden;
    }
`;

export { App };
