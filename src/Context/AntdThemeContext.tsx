import { ConfigProvider, type GlobalToken, theme } from "antd";
import * as React from "react";

/**
 * The type for the theming context payload.
 */
type ThemeContextPayload = {
    setTheme: ((value: "dark" | "light") => void) | null;
    updateBackground: ((token: GlobalToken) => void) | null;
    antdTheme: "dark" | "light";
};

/**
 * The context for the theming.
 */
const ThemeContext = React.createContext<ThemeContextPayload>({
    setTheme: null,
    updateBackground: null,
    antdTheme: "light",
});

type Props = {
    children?: React.ReactNode;
};

/**
 * A custom hook for the theme token.
 */
const { useToken } = theme;

/**
 * A component for the antd theme changing at runtime.
 * @param param0 The children for the component.
 * @returns {JSX.Element} The rendered component.
 */
const AntdThemeProvider = ({ children }: Props) => {
    const [antdTheme, setAntdTheme] = React.useState<"dark" | "light">("light");

    const setTheme = React.useCallback((value: "dark" | "light") => {
        setAntdTheme(value);
    }, []);

    // Updates the background colors of the body and root elements.
    // Combine this with useEffect hook using useToken hook's return value as a dependency.
    const updateBackground = React.useCallback(
        (token: GlobalToken) => {
            const body = document.querySelector("body");
            if (body) {
                body.style.backgroundColor = antdTheme === "dark" ? "black" : "white";
                body.style.height = "100vh";
                const root = document.querySelector("#root") as HTMLElement;

                if (root) {
                    root.style.backgroundColor = token.colorPrimaryBg;
                    root.style.color = token.colorPrimary;
                }
            }
        },
        [antdTheme]
    );

    return (
        <ConfigProvider
            theme={{
                algorithm: antdTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            <ThemeContext.Provider value={{ setTheme, updateBackground, antdTheme }}>{children}</ThemeContext.Provider>
        </ConfigProvider>
    );
};

/**
 * A custom hook for the {@link AntdThemeProvider} component.
 * @returns {ThemeContextPayload} The context payload.
 */
const useAntdTheme = () => React.useContext(ThemeContext);

export { useAntdTheme, AntdThemeProvider, useToken as useAntdToken };
