import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { AntdThemeProvider } from "./Context/AntdThemeContext.tsx";
import "@ant-design/v5-patch-for-react-19";

declare global {
    interface GlobalThis {
        showOpenFilePicker: () => Promise<FileSystemHandle[]>;
    }
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AntdThemeProvider>
            <App />
        </AntdThemeProvider>
    </StrictMode>
);
